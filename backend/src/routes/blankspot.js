const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");

// Koordinat batas Kota Padang yang lebih akurat (fallback)
const PADANG_BOUNDARY = [
  [100.2892, -0.7821],
  [100.3124, -0.7634],
  [100.3512, -0.7589],
  [100.3891, -0.7712],
  [100.4312, -0.7891],
  [100.4712, -0.8034],
  [100.5012, -0.8312],
  [100.5234, -0.8712],
  [100.5312, -0.9112],
  [100.5234, -0.9512],
  [100.4934, -0.9912],
  [100.4534, -1.0212],
  [100.4134, -1.0512],
  [100.3734, -1.0712],
  [100.3334, -1.0812],
  [100.3012, -1.0712],
  [100.2712, -1.0412],
  [100.2512, -1.0012],
  [100.2412, -0.9512],
  [100.2534, -0.9012],
  [100.2712, -0.8612],
  [100.2892, -0.8212],
  [100.2892, -0.7821],
];

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
        SELECT ST_Difference(k.geom, c.geom) AS geom
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
      [radius],
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

    const mockList = damkar.getMockList();
    // Fallback: representasikan blank spot sebagai polygon kota dengan "holes" untuk tiap pos
    const latDeg = radius / 111320;
    const holes = mockList.map((pos) => {
      const lngDeg = radius / (111320 * Math.cos((pos.lat * Math.PI) / 180));
      const ring = [];
      for (let i = 0; i <= 32; i++) {
        const angle = (i * 2 * Math.PI) / 32;
        ring.push([
          pos.lng + lngDeg * Math.cos(angle),
          pos.lat + latDeg * Math.sin(angle),
        ]);
      }
      ring[32] = ring[0];
      return ring;
    });

    const singleArea = Math.PI * Math.pow(radius / 1000, 2);
    const totalCoverage = Math.min(686.67, mockList.length * singleArea * 0.85);
    const blankArea = Math.max(0, 686.67 - totalCoverage);

    res.json({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [PADANG_BOUNDARY, ...holes] },
      properties: {
        luas_km2: parseFloat(blankArea.toFixed(2)),
        radius_used: radius,
      },
    });
  }
});

module.exports = router;
