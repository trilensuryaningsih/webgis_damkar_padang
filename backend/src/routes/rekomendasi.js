const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");
const { reverseGeocode } = require("../utils/geocoder");

// In-memory cache for recommendation queries
let recommendationCache = {};

// Clean/invalidate recommendation cache
router.clearCache = () => {
  recommendationCache = {};
  console.log("🧹 Recommendation cache cleared because of changes in Pos Damkar.");
};

// ============================================================
// Greedy Set Cover Algorithm — Grid Sampling Approach
// ============================================================
async function greedySetCover(radius, maxIterations = 10) {
  const candidates = [];

  // Step 1: Ambil blankspot awal dari database
  const initQuery = await pool.query(
    `
    WITH coverage AS (
      SELECT ST_Union(ST_Buffer(geom::geography, $1)::geometry) AS geom
      FROM data_damkar_padang
    ),
    kota AS (SELECT ST_Union(geom) AS geom FROM batas_wilayah)
    SELECT
      ST_AsText(ST_Difference(k.geom, c.geom)) AS blankspot_wkt,
      ROUND(ST_Area(ST_Difference(k.geom, c.geom)::geography)::numeric/1000000, 2) AS luas_km2,
      ROUND(ST_Area(c.geom::geography)::numeric/1000000, 2) AS luas_terlayani_km2,
      ROUND(ST_Area(k.geom::geography)::numeric/1000000, 2) AS luas_kota_km2
    FROM kota k CROSS JOIN coverage c
  `,
    [radius],
  );

  if (!initQuery.rows[0]) return { candidates: [], summary: null };

  const luasKota = parseFloat(initQuery.rows[0].luas_kota_km2);
  const luasTerlayani = parseFloat(initQuery.rows[0].luas_terlayani_km2);
  let luasBlankspot = parseFloat(initQuery.rows[0].luas_km2);
  let blankspotWkt = initQuery.rows[0].blankspot_wkt;
  const coverageBefore = luasTerlayani;

  const MIN_KM2 = 1.0;
  let totalKontribusi = 0;

  for (let i = 0; i < maxIterations; i++) {
    if (luasBlankspot <= MIN_KM2) break;

    // Step 2: Sampling grid titik kandidat dari blankspot saat ini
    const bestCandidateQuery = await pool.query(
      `
      WITH blankspot AS (SELECT ST_GeomFromText($1, 4326) AS geom),
      grid AS (
        SELECT ST_PointN(geom, generate_series(1, ST_NPoints(geom))) AS pt
        FROM (
          SELECT ST_ExteriorRing(
            (ST_Dump(ST_VoronoiPolygons(
              ST_GeneratePoints(b.geom, 40)
            ))).geom
          ) AS geom
          FROM blankspot b
        ) sub
      ),
      pts_in_blankspot AS (
        SELECT DISTINCT g.pt AS geom
        FROM grid g, blankspot b
        WHERE ST_Within(g.pt, b.geom)
        LIMIT 40
      ),
      scored AS (
        SELECT
          ST_X(p.geom) AS lng,
          ST_Y(p.geom) AS lat,
          ROUND(ST_Area(ST_Intersection(
            b.geom,
            ST_Buffer(p.geom::geography, $2)::geometry
          )::geography)::numeric/1000000, 2) AS score
        FROM pts_in_blankspot p, blankspot b
      )
      SELECT lng, lat, score
      FROM scored
      WHERE score > 0
      ORDER BY score DESC
      LIMIT 1
    `,
      [blankspotWkt, radius],
    );

    if (!bestCandidateQuery.rows[0] || !bestCandidateQuery.rows[0].score) break;

    const { lng, lat, score } = bestCandidateQuery.rows[0];
    const kontribusi = parseFloat(score);

    if (kontribusi < MIN_KM2) break;

    // Step 3: Kurangi blankspot dengan buffer pos baru
    const coverQuery = await pool.query(
      `
      WITH newbuffer AS (
        SELECT ST_Buffer(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)::geometry AS geom
      ),
      blankspot AS (SELECT ST_GeomFromText($4, 4326) AS geom)
      SELECT
        ST_AsText(ST_Difference(b.geom, n.geom)) AS remaining_wkt,
        ROUND(ST_Area(ST_Difference(b.geom, n.geom)::geography)::numeric/1000000, 2) AS remaining_km2
      FROM blankspot b, newbuffer n
    `,
      [lng, lat, radius, blankspotWkt],
    );

    if (!coverQuery.rows[0]) break;

    const { remaining_wkt, remaining_km2 } = coverQuery.rows[0];
    const luasSebelum = luasBlankspot;
    const luasSesudah = parseFloat(remaining_km2);

    candidates.push({
      id: i + 1,
      pos_ke: i + 1,
      lng: parseFloat(lng),
      lat: parseFloat(lat),
      nama: `Rekomendasi Pos ${i + 1}`,
      luas_blankspot_sebelum_km2: luasSebelum,
      luas_blankspot_sesudah_km2: luasSesudah,
      kontribusi_km2: kontribusi,
      persen_kontribusi: parseFloat(((kontribusi / luasKota) * 100).toFixed(2)),
      skor_prioritas: parseFloat((kontribusi / luasBlankspot).toFixed(4)),
      radius_used: radius,
    });

    totalKontribusi += kontribusi;
    blankspotWkt = remaining_wkt;
    luasBlankspot = luasSesudah;
  }

  const coverageAfter = Math.min(luasKota, coverageBefore + totalKontribusi);
  return {
    candidates,
    summary: {
      luas_kota_km2: luasKota,
      coverage_sebelum_km2: parseFloat(coverageBefore.toFixed(2)),
      coverage_sesudah_km2: parseFloat(coverageAfter.toFixed(2)),
      persen_sebelum: parseFloat(
        ((coverageBefore / luasKota) * 100).toFixed(2),
      ),
      persen_sesudah: parseFloat(((coverageAfter / luasKota) * 100).toFixed(2)),
      sisa_blankspot_km2: parseFloat(luasBlankspot.toFixed(2)),
      total_pos_dibutuhkan: candidates.length,
      fully_covered: luasBlankspot <= MIN_KM2,
    },
  };
}

// GET /api/rekomendasi?radius=3000
router.get("/", async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  // 1. Check in-memory cache first to avoid random coordinate shifts on layer toggling
  if (recommendationCache[radius]) {
    // console.log(`Serving recommendation for radius ${radius} from cache`);
    return res.json(recommendationCache[radius]);
  }

  try {
    const { candidates, summary } = await greedySetCover(radius);

    if (!candidates || candidates.length === 0) {
      throw new Error("Greedy algorithm returned no candidates");
    }

    const features = [];
    for (const c of candidates) {
      const geo = await reverseGeocode(c.lat, c.lng);
      features.push({
        type: "Feature",
        id: c.id,
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: {
          id: c.id,
          pos_ke: c.pos_ke,
          nama: c.nama,
          luas_blankspot_sebelum_km2: c.luas_blankspot_sebelum_km2,
          luas_blankspot_sesudah_km2: c.luas_blankspot_sesudah_km2,
          kontribusi_km2: c.kontribusi_km2,
          persen_kontribusi: c.persen_kontribusi,
          skor_prioritas: c.skor_prioritas,
          luas_km2: c.kontribusi_km2,
          radius_used: radius,
          lat: c.lat,
          lng: c.lng,
          alamat_lengkap: geo.alamat_lengkap,
          kelurahan: geo.kelurahan,
          kecamatan: geo.kecamatan,
          kota: geo.kota
        },
      });
    }

    const responseJSON = {
      type: "FeatureCollection",
      features,
      summary,
    };

    recommendationCache[radius] = responseJSON;
    res.json(responseJSON);
  } catch (err) {
    console.warn(
      "⚠️ Fallback to mock data for GET /api/rekomendasi:",
      err.message,
    );

    const mockList = damkar.getMockList();
    const luasKota = 686.67;
    const singleArea = Math.PI * Math.pow(radius / 1000, 2);
    const coveredNow = Math.min(luasKota, mockList.length * singleArea * 0.85);
    let blankRemaining = Math.max(0, luasKota - coveredNow);

    const mockCandidates = [
      { coords: [100.3524, -0.8524], nama: "Koto Tangah Utara" },
      { coords: [100.4412, -0.9012], nama: "Kuranji Timur" },
      { coords: [100.3124, -0.9412], nama: "Padang Barat Tengah" },
      { coords: [100.4712, -1.0012], nama: "Lubuk Begalung Selatan" },
      { coords: [100.3912, -1.0612], nama: "Bungus Teluk Kabung" },
      { coords: [100.3224, -0.8212], nama: "Koto Tangah Selatan" },
      { coords: [100.4524, -0.8612], nama: "Pauh Timur" },
    ];

    const features = [];
    let mockId = 1;
    for (const m of mockCandidates) {
      if (blankRemaining <= 1.0) break;
      const lat = m.coords[1];
      const lng = m.coords[0];
      const kontribusi = parseFloat(
        Math.min(blankRemaining, singleArea * 0.9).toFixed(2),
      );
      const sebelum = parseFloat(blankRemaining.toFixed(2));
      blankRemaining = Math.max(0, blankRemaining - kontribusi);
      const sesudah = parseFloat(blankRemaining.toFixed(2));
      
      const geo = await reverseGeocode(lat, lng);

      features.push({
        type: "Feature",
        id: mockId,
        geometry: { type: "Point", coordinates: m.coords },
        properties: {
          id: mockId,
          pos_ke: mockId,
          nama: `Rekomendasi ${mockId} - ${m.nama}`,
          luas_blankspot_sebelum_km2: sebelum,
          luas_blankspot_sesudah_km2: sesudah,
          kontribusi_km2: kontribusi,
          persen_kontribusi: parseFloat(
            ((kontribusi / luasKota) * 100).toFixed(2),
          ),
          skor_prioritas: parseFloat((kontribusi / (sebelum || 1)).toFixed(4)),
          luas_km2: kontribusi,
          radius_used: radius,
          lat: lat,
          lng: lng,
          alamat_lengkap: geo.alamat_lengkap,
          kelurahan: geo.kelurahan,
          kecamatan: geo.kecamatan,
          kota: geo.kota
        },
      });
      mockId++;
    }

    const finalCoverage = luasKota - blankRemaining;
    const responseJSON = {
      type: "FeatureCollection",
      features,
      summary: {
        luas_kota_km2: luasKota,
        coverage_sebelum_km2: parseFloat(coveredNow.toFixed(2)),
        coverage_sesudah_km2: parseFloat(finalCoverage.toFixed(2)),
        persen_sebelum: parseFloat(((coveredNow / luasKota) * 100).toFixed(2)),
        persen_sesudah: parseFloat(
          ((finalCoverage / luasKota) * 100).toFixed(2),
        ),
        sisa_blankspot_km2: parseFloat(blankRemaining.toFixed(2)),
        total_pos_dibutuhkan: features.length,
        fully_covered: blankRemaining <= 1.0,
      },
    };

    recommendationCache[radius] = responseJSON;
    res.json(responseJSON);
  }
});

module.exports = router;
