const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const MOCK_JALAN = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.3543, -0.8012],
          [100.3601, -0.8504],
          [100.3705, -0.9102],
          [100.3802, -0.9604],
          [100.3951, -1.0201]
        ]
      },
      properties: { highway: 'primary', name: 'Jl. By Pass Padang' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.3482, -0.8924],
          [100.3512, -0.9124],
          [100.3551, -0.9324],
          [100.3604, -0.9524]
        ]
      },
      properties: { highway: 'primary', name: 'Jl. Khatib Sulaiman / Jl. Sudirman' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.3204, -0.7601],
          [100.3342, -0.8002],
          [100.3482, -0.8404]
        ]
      },
      properties: { highway: 'primary', name: 'Jl. Adinegoro' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.3682, -0.9602],
          [100.3804, -0.9924],
          [100.3902, -1.0304]
        ]
      },
      properties: { highway: 'secondary', name: 'Jl. Sutan Syahrir' }
    }
  ]
};

// GET jaringan jalan (hanya jalan utama untuk performa)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
              'highway', highway,
              'name', name
            )
          )
        )
      ) AS geojson
      FROM jaringan_jalan
      WHERE highway IN (
        'primary', 'secondary', 'tertiary', 
        'trunk', 'motorway', 'residential'
      )
    `);
    if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.features) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error('Database returned empty features');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/jalan:', err.message);
    res.json(MOCK_JALAN);
  }
});

module.exports = router;

