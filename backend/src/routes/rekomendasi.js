const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const MOCK_REKOMENDASI = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.3524, -0.8524] },
      properties: { id: 1, nama: 'Kandidat 1 (Koto Tangah)', luas_km2: 45.2, skor_prioritas: 0.92 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.4352, -0.9102] },
      properties: { id: 2, nama: 'Kandidat 2 (Kuranji)', luas_km2: 38.5, skor_prioritas: 0.85 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.3804, -0.8842] },
      properties: { id: 3, nama: 'Kandidat 3 (Nanggalo)', luas_km2: 29.1, skor_prioritas: 0.74 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.4182, -0.9782] },
      properties: { id: 4, nama: 'Kandidat 4 (Lubuk Begalung)', luas_km2: 25.4, skor_prioritas: 0.68 }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.4043, -1.0604] },
      properties: { id: 5, nama: 'Kandidat 5 (Bungus Teluk Kabung)', luas_km2: 21.8, skor_prioritas: 0.59 }
    }
  ]
};

// GET 5 kandidat rekomendasi lokasi pos baru
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
              'id', id,
              'nama', nama,
              'luas_km2', luas_km2,
              'skor_prioritas', skor_prioritas
            )
          )
        )
      ) AS geojson
      FROM kandidat_rekomendasi
      ORDER BY skor_prioritas DESC
    `);
    if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.features) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error('Database returned empty features');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/rekomendasi:', err.message);
    res.json(MOCK_REKOMENDASI);
  }
});

module.exports = router;

