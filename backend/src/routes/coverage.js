const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const damkar = require('./damkar');

// Helper to generate a polygon approximating a circle around a point
function getCirclePolygon(lng, lat, radiusMeters) {
  const coords = [];
  const points = 32;
  // Approximation of degrees per meter
  const latDeg = radiusMeters / 111320;
  const lngDeg = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i < points; i++) {
    const angle = (i * 360 / points) * Math.PI / 180;
    const x = lng + lngDeg * Math.cos(angle);
    const y = lat + latDeg * Math.sin(angle);
    coords.push([x, y]);
  }
  coords.push(coords[0]); // Close polygon
  return [coords];
}

// GET coverage area tiap pos damkar
router.get('/', async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  try {
    const result = await pool.query(`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(
              ST_Buffer(geom::geography, $1)::geometry
            )::json,
            'properties', json_build_object(
              'id', id,
              'nama_lokasi', nama_lokasi,
              'radius_m', $1
            )
          )
        )
      ) AS geojson
      FROM data_damkar_padang
    `, [radius]);
    if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.features) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error('Database returned empty or invalid results');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/coverage:', err.message);
    
    // Generate buffers for active in-memory mock damkar list
    const mockList = damkar.getMockList();
    const features = mockList.map(pos => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: getCirclePolygon(pos.lng, pos.lat, radius)
      },
      properties: {
        id: pos.id,
        nama_lokasi: pos.nama_lokasi,
        radius_m: radius
      }
    }));
    
    res.json({
      type: 'FeatureCollection',
      features
    });
  }
});

module.exports = router;

