const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");

// Koordinat batas Kota Padang yang lebih akurat (fallback)
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

// GET /api/blankspot?radius=3000
// Blank Spot = ST_Difference(batas_wilayah, ST_Union(buffer semua pos damkar))
router.get("/", async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  try {
    const result = await pool.query(
      `
      WITH coverage AS (
        SELECT ST_Union(ST_Buffer(geom::geography, $1)::geometry) AS geom
        FROM data_damkar_padang
      ),
      kota AS (
        SELECT ST_Union(geom) AS geom FROM batas_wilayah
      ),
      blankspot_geom AS (
        SELECT ST_Intersection(ST_Difference(k.geom, c.geom), ST_GeomFromText($2, 4326)) AS geom
        FROM kota k CROSS JOIN coverage c
      )
      SELECT json_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(geom)::json,
        'properties', json_build_object(
          'luas_km2', ROUND(ST_Area(geom::geography)::numeric / 1000000, 2),
          'radius_used', $1,
          'is_empty', ST_IsEmpty(geom)
        )
      ) AS geojson
      FROM blankspot_geom
    `,
      [radius, PADANG_LAND_WKT],
    );

    if (
      result.rows[0] &&
      result.rows[0].geojson &&
      result.rows[0].geojson.geometry
    ) {
      const feature = result.rows[0].geojson;
      // Jika blank spot kosong (seluruh kota sudah terlayani), kembalikan empty polygon
      if (feature.properties.is_empty) {
        return res.json({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: { luas_km2: 0, radius_used: radius, fully_covered: true },
        });
      }
      return res.json(feature);
    }
    throw new Error("Database returned empty geometry");
  } catch (err) {
    console.warn(
      "⚠️ Fallback to mock data for GET /api/blankspot:",
      err.message,
    );

    const turf = require("@turf/turf");
    const mockList = damkar.getMockList();

    try {
      // 1. Buat polygon batas kota Padang
      const boundaryPoly = turf.polygon([PADANG_BOUNDARY]);

      // 2. Buat buffer lingkaran untuk setiap pos damkar
      const buffers = mockList.map((pos) => {
        return turf.circle([pos.lng, pos.lat], radius / 1000, {
          units: "kilometers",
          steps: 64,
        });
      });

      // 3. Gabungkan (Union) semua buffer lingkaran pos damkar
      let unionedCoverage = buffers[0];
      for (let i = 1; i < buffers.length; i++) {
        unionedCoverage = turf.union(turf.featureCollection([unionedCoverage, buffers[i]]));
      }

      // 4. Hitung selisih (Difference) = batas kota - unioned coverage
      const blankspotFeature = turf.difference(turf.featureCollection([boundaryPoly, unionedCoverage]));

      if (blankspotFeature) {
        // Hitung luas area blankspot (dalam km2)
        const areaM2 = turf.area(blankspotFeature);
        const areaKm2 = areaM2 / 1000000;

        return res.json({
          type: "Feature",
          geometry: blankspotFeature.geometry,
          properties: {
            luas_km2: parseFloat(areaKm2.toFixed(2)),
            radius_used: radius,
          },
        });
      }
      
      res.json({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [] },
        properties: { luas_km2: 0, radius_used: radius, fully_covered: true },
      });

    } catch (spatialErr) {
      console.error("❌ Turf.js spatial operation failed:", spatialErr.message);
      // Fallback kasar jika Turf gagal
      const singleArea = Math.PI * Math.pow(radius / 1000, 2);
      const totalCoverage = Math.min(686.67, mockList.length * singleArea * 0.85);
      const blankArea = Math.max(0, 686.67 - totalCoverage);
      res.json({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [PADANG_BOUNDARY] },
        properties: {
          luas_km2: parseFloat(blankArea.toFixed(2)),
          radius_used: radius,
        },
      });
    }
  }
});

module.exports = router;
