const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const damkar = require('./damkar');

// Helper to generate a circle ring
function getCircleRing(lng, lat, radiusMeters) {
  const coords = [];
  const points = 32;
  const latDeg = radiusMeters / 111320;
  const lngDeg = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i < points; i++) {
    const angle = (i * 360 / points) * Math.PI / 180;
    const x = lng + lngDeg * Math.cos(angle);
    const y = lat + latDeg * Math.sin(angle);
    coords.push([x, y]);
  }
  coords.push(coords[0]);
  return coords;
}

// Approximation of Kota Padang outer boundary
const PADANG_EXTERIOR = [
  [100.31, -0.78],
  [100.46, -0.78],
  [100.53, -0.88],
  [100.54, -0.98],
  [100.42, -1.09],
  [100.35, -1.09],
  [100.31, -1.00],
  [100.29, -0.90],
  [100.31, -0.78]
];

// GET polygon blank spot (support radius dinamis)
router.get('/', async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  try {
    // Kalau radius default (3000), pakai tabel yang sudah dihitung
    if (radius === 3000) {
      const result = await pool.query(`
        SELECT json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'luas_km2', ROUND(ST_Area(geom::geography)::numeric/1000000, 2),
            'radius_used', 3000
          )
        ) AS geojson
        FROM blank_spot
      `);
      if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.geometry) {
        return res.json(result.rows[0].geojson);
      }
    }

    // Kalau radius custom, hitung ulang on-the-fly
    const result = await pool.query(`
      WITH coverage AS (
        SELECT ST_Union(ST_Buffer(geom::geography, $1)::geometry) AS geom
        FROM data_damkar_padang
      ),
      kota AS (
        SELECT ST_Union(geom) AS geom FROM batas_wilayah
      )
      SELECT json_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(ST_Difference(k.geom, c.geom))::json,
        'properties', json_build_object(
          'luas_km2', ROUND(
            ST_Area(ST_Difference(k.geom, c.geom)::geography)::numeric/1000000, 2
          ),
          'radius_used', $1
        )
      ) AS geojson
      FROM kota k, coverage c
    `, [radius]);
    if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.geometry) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error('Database returned empty geometry');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/blankspot:', err.message);
    
    // Create blankspot polygon: Exterior ring represents city boundary,
    // interior rings (holes) represent the coverage of each pos damkar.
    const mockList = damkar.getMockList();
    const holes = mockList.map(pos => getCircleRing(pos.lng, pos.lat, radius));
    
    // Estimate blank spot area: total city area (approx 686.67 km²) minus sum of coverage areas
    const singleCoverageArea = Math.PI * Math.pow(radius / 1000, 2); // pi * r^2 in km2
    const totalCoverageArea = Math.min(686.67, mockList.length * singleCoverageArea * 0.9); // with some overlap factor 0.9
    const blankSpotArea = Math.max(0, 686.67 - totalCoverageArea);

    res.json({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [PADANG_EXTERIOR, ...holes]
      },
      properties: {
        luas_km2: parseFloat(blankSpotArea.toFixed(2)),
        radius_used: radius
      }
    });
  }
});

module.exports = router;
