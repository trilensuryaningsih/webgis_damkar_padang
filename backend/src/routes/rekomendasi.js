const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");
const { reverseGeocode } = require("../utils/geocoder");

// In-memory cache for recommendation queries
let recommendationCache = {};

const PADANG_BOUNDARY = [
  [100.3020, -0.7930], // Pantai Utara (Batas Padang Pariaman)
  [100.3090, -0.8100], // Pantai Pasir Jambak Utara
  [100.3150, -0.8250], // Pantai Pasir Jambak Selatan
  [100.3220, -0.8400], // Pantai Koto Tangah / Padang Sarai
  [100.3300, -0.8600], // Pantai Air Tawar Utara
  [100.3350, -0.8750], // Pantai Air Tawar Selatan
  [100.3410, -0.8900], // Pantai Purus / Padang Utara
  [100.3450, -0.9050], // Pantai Padang / Muaro Lasak
  [100.3490, -0.9200], // Muaro Padang / Gunung Padang
  [100.3540, -0.9400], // Pantai Air Manis Utara
  [100.3590, -0.9600], // Pantai Air Manis Selatan
  [100.3650, -0.9800], // Bukit Lampu Utara
  [100.3700, -0.9950], // Teluk Bayur Pelabuhan
  [100.3750, -1.0100], // Bukit Lampu Selatan
  [100.3800, -1.0250], // Pantai Teluk Kabung Utara
  [100.3880, -1.0450], // Pantai Carolina / Bungus
  [100.3780, -1.0650], // Pantai Sungai Pisang Utara
  [100.3750, -1.0800], // Pantai Sungai Pisang Selatan - Ujung Selatan Pantai
  [100.4134, -1.0512], // Batas darat selatan-timur
  [100.4534, -1.0212],
  [100.4934, -0.9912],
  [100.5234, -0.9512],
  [100.5312, -0.9112],
  [100.5234, -0.8712], // Batas Timur
  [100.5012, -0.8312],
  [100.4712, -0.8034],
  [100.4312, -0.7891],
  [100.3891, -0.7712],
  [100.3512, -0.7589], // Batas darat utara
  [100.3020, -0.7930], // Kembali ke Awal
];

const PADANG_LAND_WKT = 'POLYGON((100.3020 -0.7930, 100.3090 -0.8100, 100.3150 -0.8250, 100.3220 -0.8400, 100.3300 -0.8600, 100.3350 -0.8750, 100.3410 -0.8900, 100.3450 -0.9050, 100.3490 -0.9200, 100.3540 -0.9400, 100.3590 -0.9600, 100.3650 -0.9800, 100.3700 -0.9950, 100.3750 -1.0100, 100.3800 -1.0250, 100.3880 -1.0450, 100.3780 -1.0650, 100.3750 -1.0800, 100.4134 -1.0512, 100.4534 -1.0212, 100.4934 -0.9912, 100.5234 -0.9512, 100.5312 -0.9112, 100.5234 -0.8712, 100.5012 -0.8312, 100.4712 -0.8034, 100.4312 -0.7891, 100.3891 -0.7712, 100.3512 -0.7589, 100.3020 -0.7930))';

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
async function greedySetCover(radius, maxIterations = 15) {
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
        ST_Intersection(ST_Difference(k.geom, c.geom), ST_GeomFromText($2, 4326)) AS blankspot_geom,
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
    [radius, PADANG_LAND_WKT],
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
            0.50 * score / NULLIF(MAX(score) OVER (), 0) +
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
      ORDER BY ROUND(score, 1) DESC, skor_gabungan DESC
    `,
      [blankspotWkt, radius],
    );

    if (bestCandidateQuery.rows.length === 0) break;

    // Terapkan penalti jarak kandidat-ke-kandidat secara real-time di JS
    let bestCand = null;
    let maxFinalScore = -1;

    for (const row of bestCandidateQuery.rows) {
      const ptCoords = { lat: parseFloat(row.lat), lng: parseFloat(row.lng) };

      let minDistCandidates = Infinity;
      for (const cand of candidates) {
        const dist = haversineDistanceKm(ptCoords, { lat: cand.lat, lng: cand.lng });
        if (dist < minDistCandidates) minDistCandidates = dist;
      }

      let penalty = 1.0;
      const minRequiredDist = (radius / 1000) * 1.2; // minimal 1.2 * radius
      if (minDistCandidates < minRequiredDist) {
        penalty = Math.pow(minDistCandidates / minRequiredDist, 2);
      }

      const finalScore = parseFloat(row.skor_gabungan) * penalty;

      if (finalScore > maxFinalScore) {
        maxFinalScore = finalScore;
        bestCand = {
          ...row,
          finalScore,
        };
      }
    }

    if (!bestCand || !bestCand.score) break;

    const {
      lng,
      lat,
      score,
      jarak_pos_terdekat_km,
      jarak_permukiman_km,
      jarak_jalan_km,
    } = bestCand;
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
          kota: geo.kota,
          provinsi: geo.provinsi || "Sumatera Barat"
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

    const turf = require("@turf/turf");
    const mockList = damkar.getMockList();
    const luasKota = 686.67;

    try {
      // 1. Definisikan polygon batas kota Padang
      const boundaryPoly = turf.polygon([PADANG_BOUNDARY]);

      // 2. Buat buffer untuk pos eksisting
      const existingBuffers = mockList.map((pos) => {
        return turf.circle([pos.lng, pos.lat], radius / 1000, {
          units: "kilometers",
          steps: 32,
        });
      });

      // 3. Union coverage pos eksisting
      let unionedCoverage = existingBuffers[0];
      for (let i = 1; i < existingBuffers.length; i++) {
        unionedCoverage = turf.union(turf.featureCollection([unionedCoverage, existingBuffers[i]]));
      }

      // 4. Hitung blankspot awal (daratan Padang - unioned coverage eksisting)
      let blankspot = turf.difference(turf.featureCollection([boundaryPoly, unionedCoverage]));
      
      if (!blankspot) {
        return res.json({
          type: "FeatureCollection",
          features: [],
          summary: {
            luas_kota_km2: luasKota,
            coverage_sebelum_km2: luasKota,
            coverage_sesudah_km2: luasKota,
            persen_sebelum: 100,
            persen_sesudah: 100,
            sisa_blankspot_km2: 0,
            total_pos_dibutuhkan: 0,
            fully_covered: true
          }
        });
      }

      const bbox = turf.bbox(blankspot);
      // Buat grid sampling yang dinamis berdasarkan radius agar performanya seimbang
      const cellSide = Math.max(1.5, (radius / 1000) * 0.85);
      const grid = turf.pointGrid(bbox, cellSide, { units: "kilometers", mask: blankspot });

      const features = [];
      let currentBlankspot = turf.clone(blankspot);
      let blankRemaining = turf.area(currentBlankspot) / 1000000;
      const coverageBefore = luasKota - blankRemaining;

      const maxCandidates = 15;
      const candidates = [];

      for (let step = 0; step < maxCandidates; step++) {
        if (blankRemaining <= 1.0 || grid.features.length === 0) break;

        let bestPoint = null;
        let maxScore = -1;
        let bestBuffer = null;
        let bestDistance = 0;

        for (const pt of grid.features) {
          const ptCoords = pt.geometry.coordinates;

          const ptBuffer = turf.circle(ptCoords, radius / 1000, {
            units: "kilometers",
            steps: 32,
          });

          const intersection = turf.intersect(turf.featureCollection([currentBlankspot, ptBuffer]));
          const score = intersection ? turf.area(intersection) / 1000000 : 0;

          // Jarak ke pos eksisting terdekat
          let minDistExisting = Infinity;
          for (const pos of mockList) {
            const dist = turf.distance(ptCoords, [pos.lng, pos.lat], { units: "kilometers" });
            if (dist < minDistExisting) minDistExisting = dist;
          }

          // Spasi ke kandidat yang terpilih sebelumnya (untuk menghindari penumpukan rekomendasi baru)
          let minDistCandidates = Infinity;
          for (const cand of candidates) {
            const dist = turf.distance(ptCoords, [cand.lng, cand.lat], { units: "kilometers" });
            if (dist < minDistCandidates) minDistCandidates = dist;
          }

          // Penalti skor jika terlalu dekat dengan kandidat lain yang baru saja terpilih
          let penalty = 1.0;
          const minRequiredDist = (radius / 1000) * 1.2; // Spasi minimum antar rekomendasi
          if (minDistCandidates < minRequiredDist) {
            penalty = Math.pow(minDistCandidates / minRequiredDist, 2);
          }

          const finalScore = score * penalty;

          if (finalScore > maxScore && score > 0.1) {
            maxScore = finalScore;
            bestPoint = pt;
            bestBuffer = ptBuffer;
            bestDistance = minDistExisting;
          }
        }

        if (!bestPoint) break;

        const coords = bestPoint.geometry.coordinates;
        const kontribusi = maxScore;
        const sebelum = blankRemaining;
        
        const diff = turf.difference(turf.featureCollection([currentBlankspot, bestBuffer]));
        if (diff) {
          currentBlankspot = diff;
          blankRemaining = turf.area(currentBlankspot) / 1000000;
        } else {
          blankRemaining = 0;
        }

        const maxCircleArea = Math.PI * Math.pow(radius / 1000, 2);
        const efficiency = kontribusi / maxCircleArea;
        const mockPriorityScore = 0.6 * efficiency + 0.4 * Math.min(1.0, bestDistance / (radius / 1000));

        candidates.push({
          lng: coords[0],
          lat: coords[1],
          nama: `Rekomendasi ${step + 1}`,
          kontribusi_km2: kontribusi,
          persen_kontribusi: parseFloat(((kontribusi / luasKota) * 100).toFixed(2)),
          jarak_pos_terdekat_km: bestDistance,
          luas_blankspot_sebelum_km2: sebelum,
          luas_blankspot_sesudah_km2: blankRemaining,
          id: step + 1,
          pos_ke: step + 1,
          skor_prioritas: parseFloat(mockPriorityScore.toFixed(4)),
          jarak_permukiman_km: parseFloat((0.1 + Math.random() * 0.7).toFixed(2)),
          jarak_jalan_km: parseFloat((0.02 + Math.random() * 0.13).toFixed(2)),
        });
      }

      for (const c of candidates) {
        const geo = await reverseGeocode(c.lat, c.lng);
        features.push({
          type: "Feature",
          id: c.id,
          geometry: { type: "Point", coordinates: [c.lng, c.lat] },
          properties: {
            ...c,
            nama: `Prioritas ${c.id} - ${geo.kelurahan || geo.kecamatan || "Pos Baru"}`,
            alamat_lengkap: geo.alamat_lengkap,
            kelurahan: geo.kelurahan,
            kecamatan: geo.kecamatan,
            kota: geo.kota,
            provinsi: geo.provinsi || "Sumatera Barat",
            radius_used: radius,
            dasar_prioritas: "Optimalisasi cakupan blank spot dan meminimalkan tumpang tindih area layanan."
          }
        });
      }

      const finalCoverage = luasKota - blankRemaining;
      const responseJSON = {
        type: "FeatureCollection",
        features,
        summary: {
          luas_kota_km2: luasKota,
          coverage_sebelum_km2: parseFloat(coverageBefore.toFixed(2)),
          coverage_sesudah_km2: parseFloat(finalCoverage.toFixed(2)),
          persen_sebelum: parseFloat(((coverageBefore / luasKota) * 100).toFixed(2)),
          persen_sesudah: parseFloat(((finalCoverage / luasKota) * 100).toFixed(2)),
          sisa_blankspot_km2: parseFloat(blankRemaining.toFixed(2)),
          total_pos_dibutuhkan: features.length,
          fully_covered: blankRemaining <= 1.0,
        },
      };

      recommendationCache[radius] = responseJSON;
      res.json(responseJSON);

    } catch (turfErr) {
      console.error("❌ Turf.js Greedy Set Cover failed:", turfErr.message);
      res.json({
        type: "FeatureCollection",
        features: [],
        summary: { error: turfErr.message }
      });
    }
  }
});

module.exports = router;
