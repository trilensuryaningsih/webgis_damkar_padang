const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");
const { reverseGeocode } = require("../utils/geocoder");

// In-memory cache for recommendation queries
let recommendationCache = {};

function haversineDistanceKm(a, b) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const value =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(value));
}

function rankCandidates(candidates) {
  const maxDistance = Math.max(
    ...candidates.map((candidate) => candidate.jarak_pos_terdekat_km),
    1,
  );
  const maxContribution = Math.max(
    ...candidates.map((candidate) => candidate.kontribusi_km2),
    1,
  );

  const scored = candidates.map((candidate) => {
    const settlementScore = Math.max(
      0,
      1 - candidate.jarak_permukiman_km / 2.5,
    );
    const accessScore = Math.max(0, 1 - candidate.jarak_jalan_km / 0.75);
    const coverageScore = candidate.kontribusi_km2 / maxContribution;
    const distanceScore = candidate.jarak_pos_terdekat_km / maxDistance;
    const priorityScore =
      settlementScore * 0.35 +
      coverageScore * 0.3 +
      distanceScore * 0.2 +
      accessScore * 0.15;

    return { ...candidate, skor_prioritas: priorityScore };
  });

  return scored
    .sort(
      (a, b) =>
        b.skor_prioritas - a.skor_prioritas ||
        a.jarak_permukiman_km - b.jarak_permukiman_km ||
        b.kontribusi_km2 - a.kontribusi_km2,
    )
    .map((candidate, index) => ({
      ...candidate,
      id: index + 1,
      pos_ke: index + 1,
      nama: `Prioritas ${index + 1} - Pos Baru`,
      skor_prioritas: parseFloat(candidate.skor_prioritas.toFixed(4)),
    }));
}

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
    kota AS (SELECT ST_Union(geom) AS geom FROM batas_wilayah),
    analysis AS (
      SELECT
        k.geom AS kota_geom,
        ST_Difference(k.geom, c.geom) AS blankspot_geom,
        ST_Intersection(k.geom, c.geom) AS coverage_geom
      FROM kota k CROSS JOIN coverage c
    )
    SELECT
      ST_AsText(blankspot_geom) AS blankspot_wkt,
      ROUND(ST_Area(blankspot_geom::geography)::numeric/1000000, 2) AS luas_km2,
      ROUND(ST_Area(coverage_geom::geography)::numeric/1000000, 2) AS luas_terlayani_km2,
      ROUND(ST_Area(kota_geom::geography)::numeric/1000000, 2) AS luas_kota_km2
    FROM analysis
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
              ST_GeneratePoints(b.geom, 80)
            ))).geom
          ) AS geom
          FROM blankspot b
        ) sub
      ),
      pts_in_blankspot AS (
        SELECT DISTINCT g.pt AS geom
        FROM grid g, blankspot b
        WHERE ST_Within(g.pt, b.geom)
        LIMIT 80
      ),
      candidate_metrics AS (
        SELECT
          ST_X(p.geom) AS lng,
          ST_Y(p.geom) AS lat,
          ROUND(ST_Area(ST_Intersection(
            b.geom,
            ST_Buffer(p.geom::geography, $2)::geometry
          )::geography)::numeric/1000000, 2) AS score,
          ROUND((
            SELECT MIN(ST_Distance(p.geom::geography, d.geom::geography))
            FROM data_damkar_padang d
          )::numeric/1000, 2) AS jarak_pos_terdekat_km,
          ROUND((
            SELECT ST_Distance(p.geom::geography, j.geom::geography)
            FROM jaringan_jalan j
            WHERE j.highway = 'residential'
            ORDER BY p.geom <-> j.geom
            LIMIT 1
          )::numeric/1000, 3) AS jarak_permukiman_km,
          ROUND((
            SELECT ST_Distance(p.geom::geography, j.geom::geography)
            FROM jaringan_jalan j
            WHERE j.highway IN (
              'residential', 'tertiary', 'secondary', 'primary', 'trunk'
            )
              AND COALESCE(j.access, '') NOT IN ('private', 'no')
              AND COALESCE(j.motor_vehicle, '') NOT IN ('private', 'no')
            ORDER BY p.geom <-> j.geom
            LIMIT 1
          )::numeric/1000, 3) AS jarak_jalan_km
        FROM pts_in_blankspot p, blankspot b
      ),
      scored AS (
        SELECT
          *,
          (
            0.35 * GREATEST(0, 1 - jarak_permukiman_km / 2.5) +
            0.30 * score / NULLIF(MAX(score) OVER (), 0) +
            0.20 * jarak_pos_terdekat_km /
              NULLIF(MAX(jarak_pos_terdekat_km) OVER (), 0) +
            0.15 * GREATEST(0, 1 - jarak_jalan_km / 0.75)
          ) AS skor_gabungan
        FROM candidate_metrics
      )
      SELECT
        lng,
        lat,
        score,
        jarak_pos_terdekat_km,
        jarak_permukiman_km,
        jarak_jalan_km,
        skor_gabungan
      FROM scored
      WHERE score > 0
        AND jarak_permukiman_km <= 2.5
        AND jarak_jalan_km <= 0.75
      ORDER BY skor_gabungan DESC, score DESC
      LIMIT 1
    `,
      [blankspotWkt, radius],
    );

    if (!bestCandidateQuery.rows[0] || !bestCandidateQuery.rows[0].score) break;

    const {
      lng,
      lat,
      score,
      jarak_pos_terdekat_km,
      jarak_permukiman_km,
      jarak_jalan_km,
    } =
      bestCandidateQuery.rows[0];
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
      lng: parseFloat(lng),
      lat: parseFloat(lat),
      luas_blankspot_sebelum_km2: luasSebelum,
      luas_blankspot_sesudah_km2: luasSesudah,
      kontribusi_km2: kontribusi,
      persen_kontribusi: parseFloat(((kontribusi / luasKota) * 100).toFixed(2)),
      jarak_pos_terdekat_km: parseFloat(jarak_pos_terdekat_km),
      jarak_permukiman_km: parseFloat(jarak_permukiman_km),
      jarak_jalan_km: parseFloat(jarak_jalan_km),
      radius_used: radius,
    });

    totalKontribusi += kontribusi;
    blankspotWkt = remaining_wkt;
    luasBlankspot = luasSesudah;
  }

  const rankedCandidates = rankCandidates(candidates);
  const coverageAfter = Math.min(luasKota, coverageBefore + totalKontribusi);
  return {
    candidates: rankedCandidates,
    summary: {
      luas_kota_km2: luasKota,
      coverage_sebelum_km2: parseFloat(coverageBefore.toFixed(2)),
      coverage_sesudah_km2: parseFloat(coverageAfter.toFixed(2)),
      persen_sebelum: parseFloat(
        ((coverageBefore / luasKota) * 100).toFixed(2),
      ),
      persen_sesudah: parseFloat(((coverageAfter / luasKota) * 100).toFixed(2)),
      sisa_blankspot_km2: parseFloat(luasBlankspot.toFixed(2)),
      total_pos_dibutuhkan: rankedCandidates.length,
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

    if ((!candidates || candidates.length === 0) && !summary?.fully_covered) {
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
          jarak_pos_terdekat_km: c.jarak_pos_terdekat_km,
          jarak_permukiman_km: c.jarak_permukiman_km,
          jarak_jalan_km: c.jarak_jalan_km,
          dasar_prioritas:
            "Kedekatan permukiman, cakupan, jarak pos eksisting, dan akses jalan",
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
      { coords: [100.3524, -0.8524], nama: "Koto Tangah Utara", permukiman: 0.25, jalan: 0.08 },
      { coords: [100.4412, -0.9012], nama: "Kuranji Timur", permukiman: 0.45, jalan: 0.12 },
      { coords: [100.3124, -0.9412], nama: "Padang Barat Tengah", permukiman: 0.15, jalan: 0.05 },
      { coords: [100.4712, -1.0012], nama: "Lubuk Begalung Selatan", permukiman: 0.65, jalan: 0.18 },
      { coords: [100.3912, -1.0612], nama: "Bungus Teluk Kabung", permukiman: 0.9, jalan: 0.2 },
      { coords: [100.3224, -0.8212], nama: "Koto Tangah Selatan", permukiman: 0.35, jalan: 0.1 },
      { coords: [100.4524, -0.8612], nama: "Pauh Timur", permukiman: 0.7, jalan: 0.16 },
    ]
      .map((candidate) => {
        const point = { lat: candidate.coords[1], lng: candidate.coords[0] };
        const nearestDistance = Math.min(
          ...mockList.map((pos) => haversineDistanceKm(point, pos)),
        );
        return {
          ...candidate,
          jarak_pos_terdekat_km: parseFloat(nearestDistance.toFixed(2)),
        };
      })
      .sort(
        (a, b) => b.jarak_pos_terdekat_km - a.jarak_pos_terdekat_km,
      );

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
          jarak_pos_terdekat_km: m.jarak_pos_terdekat_km,
          jarak_permukiman_km: m.permukiman,
          jarak_jalan_km: m.jalan,
          skor_prioritas: 0,
          dasar_prioritas:
            "Kedekatan permukiman, cakupan, jarak pos eksisting, dan akses jalan",
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

    const rankedMockFeatures = rankCandidates(
      features.map((feature) => ({
        ...feature.properties,
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      })),
    );
    const featureByCoordinate = new Map(
      features.map((feature) => [
        feature.geometry.coordinates.join(","),
        feature,
      ]),
    );
    const rankedFeatures = rankedMockFeatures.map((candidate, index) => {
      const feature = featureByCoordinate.get(`${candidate.lng},${candidate.lat}`);
      feature.id = index + 1;
      feature.id = index + 1;
      feature.properties.id = index + 1;
      feature.properties.pos_ke = index + 1;
      feature.properties.nama = `Prioritas ${index + 1} - ${feature.properties.nama.split(" - ").pop()}`;
      feature.properties.skor_prioritas = candidate.skor_prioritas;
      return feature;
    });

    const finalCoverage = luasKota - blankRemaining;
    const responseJSON = {
      type: "FeatureCollection",
      features: rankedFeatures,
      summary: {
        luas_kota_km2: luasKota,
        coverage_sebelum_km2: parseFloat(coveredNow.toFixed(2)),
        coverage_sesudah_km2: parseFloat(finalCoverage.toFixed(2)),
        persen_sebelum: parseFloat(((coveredNow / luasKota) * 100).toFixed(2)),
        persen_sesudah: parseFloat(
          ((finalCoverage / luasKota) * 100).toFixed(2),
        ),
        sisa_blankspot_km2: parseFloat(blankRemaining.toFixed(2)),
        total_pos_dibutuhkan: rankedFeatures.length,
        fully_covered: blankRemaining <= 1.0,
      },
    };

    recommendationCache[radius] = responseJSON;
    res.json(responseJSON);
  }
});

module.exports = router;
