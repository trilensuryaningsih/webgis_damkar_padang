const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// In-memory mock data storage for fallback
let mockDamkarList = [
  { id: 1, no_pos: 1, nama_lokasi: 'Pos Damkar Padang Timur', google_maps_li: 'https://maps.google.com/?q=-0.9429,100.3705', lat: -0.9429, lng: 100.3705 },
  { id: 2, no_pos: 2, nama_lokasi: 'Pos Damkar Padang Utara', google_maps_li: 'https://maps.google.com/?q=-0.8972,100.3508', lat: -0.8972, lng: 100.3508 },
  { id: 3, no_pos: 3, nama_lokasi: 'Pos Damkar Koto Tangah', google_maps_li: 'https://maps.google.com/?q=-0.8242,100.3248', lat: -0.8242, lng: 100.3248 },
  { id: 4, no_pos: 4, nama_lokasi: 'Pos Damkar Kuranji', google_maps_li: 'https://maps.google.com/?q=-0.9234,100.4123', lat: -0.9234, lng: 100.4123 },
  { id: 5, no_pos: 5, nama_lokasi: 'Pos Damkar Lubuk Begalung', google_maps_li: 'https://maps.google.com/?q=-0.9634,100.3982', lat: -0.9634, lng: 100.3982 },
  { id: 6, no_pos: 6, nama_lokasi: 'Pos Damkar Lubuk Kilangan', google_maps_li: 'https://maps.google.com/?q=-0.9542,100.4612', lat: -0.9542, lng: 100.4612 },
  { id: 7, no_pos: 7, nama_lokasi: 'Pos Damkar Bungus Teluk Kabung', google_maps_li: 'https://maps.google.com/?q=-1.0402,100.3912', lat: -1.0402, lng: 100.3912 }
];

// Helper to convert array of pos into GeoJSON
function convertToGeoJSON(list) {
  return {
    type: 'FeatureCollection',
    features: list.map(pos => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(pos.lng), parseFloat(pos.lat)]
      },
      properties: {
        id: pos.id,
        no_pos: pos.no_pos,
        nama_lokasi: pos.nama_lokasi,
        google_maps_link: pos.google_maps_li
      }
    }))
  };
}

// Export mock list for other routes (e.g. coverage, blankspot)
router.getMockList = () => mockDamkarList;

// ============================================================
// GET /api/damkar → semua pos sebagai GeoJSON (untuk peta)
// ============================================================
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
              'no_pos', no_pos,
              'nama_lokasi', nama_lokasi,
              'google_maps_link', google_maps_li
            )
          )
        )
      ) AS geojson
      FROM data_damkar_padang
    `);
    if (result.rows[0] && result.rows[0].geojson && result.rows[0].geojson.features) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error('Database is empty or missing features');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/damkar:', err.message);
    res.json(convertToGeoJSON(mockDamkarList));
  }
});

// ============================================================
// GET /api/damkar/list?search=xxx → semua pos (format tabel)
// ============================================================
router.get('/list', async (req, res) => {
  const search = req.query.search || '';
  try {
    const result = await pool.query(`
      SELECT 
        id,
        no_pos,
        nama_lokasi,
        google_maps_li,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng
      FROM data_damkar_padang
      WHERE 
        nama_lokasi ILIKE $1 OR 
        no_pos::text ILIKE $1
      ORDER BY no_pos
    `, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/damkar/list:', err.message);
    const filtered = mockDamkarList.filter(pos => 
      pos.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      pos.no_pos.toString().includes(search)
    ).sort((a, b) => a.no_pos - b.no_pos);
    res.json(filtered);
  }
});

// ============================================================
// GET /api/damkar/:id → detail 1 pos
// ============================================================
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(`
      SELECT 
        id, no_pos, nama_lokasi, google_maps_li,
        ST_Y(geom) AS lat,
        ST_X(geom) AS lng
      FROM data_damkar_padang
      WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.warn(`⚠️ Fallback to mock data for GET /api/damkar/${id}:`, err.message);
    const pos = mockDamkarList.find(p => p.id === id);
    if (!pos) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    res.json(pos);
  }
});

// ============================================================
// POST /api/damkar → tambah pos baru (CREATE)
// ============================================================
router.post('/', async (req, res) => {
  const { nama_lokasi, no_pos, lat, lng, google_maps_li } = req.body;
  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO data_damkar_padang 
        (nama_lokasi, no_pos, google_maps_li, geom)
      VALUES 
        ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING id, nama_lokasi, no_pos
    `, [nama_lokasi, no_pos, google_maps_li, lng, lat]);

    res.status(201).json({ 
      message: 'Pos damkar berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for POST /api/damkar:', err.message);
    const newId = mockDamkarList.length > 0 ? Math.max(...mockDamkarList.map(p => p.id)) + 1 : 1;
    const newPos = {
      id: newId,
      no_pos: parseInt(no_pos),
      nama_lokasi,
      google_maps_li: google_maps_li || `https://maps.google.com/?q=${lat},${lng}`,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    mockDamkarList.push(newPos);
    res.status(201).json({
      message: 'Pos damkar berhasil ditambahkan (Mock)',
      data: { id: newPos.id, nama_lokasi: newPos.nama_lokasi, no_pos: newPos.no_pos }
    });
  }
});

// ============================================================
// PUT /api/damkar/:id → edit data pos (UPDATE)
// ============================================================
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nama_lokasi, no_pos, lat, lng, google_maps_li } = req.body;
  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' });
  }

  try {
    const result = await pool.query(`
      UPDATE data_damkar_padang SET
        nama_lokasi   = $1,
        no_pos        = $2,
        google_maps_li = $3,
        geom          = ST_SetSRID(ST_MakePoint($4, $5), 4326)
      WHERE id = $6
      RETURNING id, nama_lokasi, no_pos
    `, [nama_lokasi, no_pos, google_maps_li, lng, lat, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    res.json({ 
      message: 'Pos damkar berhasil diupdate',
      data: result.rows[0]
    });
  } catch (err) {
    console.warn(`⚠️ Fallback to mock data for PUT /api/damkar/${id}:`, err.message);
    const index = mockDamkarList.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    mockDamkarList[index] = {
      id,
      no_pos: parseInt(no_pos),
      nama_lokasi,
      google_maps_li: google_maps_li || `https://maps.google.com/?q=${lat},${lng}`,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    res.json({
      message: 'Pos damkar berhasil diupdate (Mock)',
      data: { id, nama_lokasi, no_pos }
    });
  }
});

// ============================================================
// DELETE /api/damkar/:id → hapus pos (DELETE)
// ============================================================
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query(`
      DELETE FROM data_damkar_padang 
      WHERE id = $1 
      RETURNING id, nama_lokasi
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    res.json({ 
      message: `Pos "${result.rows[0].nama_lokasi}" berhasil dihapus`,
      id: result.rows[0].id
    });
  } catch (err) {
    console.warn(`⚠️ Fallback to mock data for DELETE /api/damkar/${id}:`, err.message);
    const index = mockDamkarList.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    const removed = mockDamkarList.splice(index, 1)[0];
    res.json({
      message: `Pos "${removed.nama_lokasi}" berhasil dihapus (Mock)`,
      id: removed.id
    });
  }
});

module.exports = router;

