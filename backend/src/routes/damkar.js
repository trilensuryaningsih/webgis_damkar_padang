const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { reverseGeocode } = require('../utils/geocoder');

// In-memory mock data storage for fallback
let mockDamkarList = [
  { id: 1, no_pos: '1', nama_lokasi: 'Pos Damkar Padang Timur', google_maps_link: 'https://maps.google.com/?q=-0.9429,100.3705', lat: -0.9429, lng: 100.3705 },
  { id: 2, no_pos: '2', nama_lokasi: 'Pos Damkar Padang Utara', google_maps_link: 'https://maps.google.com/?q=-0.8972,100.3508', lat: -0.8972, lng: 100.3508 },
  { id: 3, no_pos: '3', nama_lokasi: 'Pos Damkar Koto Tangah', google_maps_link: 'https://maps.google.com/?q=-0.8242,100.3248', lat: -0.8242, lng: 100.3248 },
  { id: 4, no_pos: '4', nama_lokasi: 'Pos Damkar Kuranji', google_maps_link: 'https://maps.google.com/?q=-0.9234,100.4123', lat: -0.9234, lng: 100.4123 },
  { id: 5, no_pos: '5', nama_lokasi: 'Pos Damkar Lubuk Begalung', google_maps_link: 'https://maps.google.com/?q=-0.9634,100.3982', lat: -0.9634, lng: 100.3982 },
  { id: 6, no_pos: '6', nama_lokasi: 'Pos Damkar Lubuk Kilangan', google_maps_link: 'https://maps.google.com/?q=-0.9542,100.4612', lat: -0.9542, lng: 100.4612 },
  { id: 7, no_pos: '7', nama_lokasi: 'Pos Damkar Bungus Teluk Kabung', google_maps_link: 'https://maps.google.com/?q=-1.0402,100.3912', lat: -1.0402, lng: 100.3912 }
];

// Helper to convert array of pos into GeoJSON with mock geocoding and stats
async function convertToGeoJSON(list, radius = 3000) {
  const features = [];
  const singleArea = Math.PI * Math.pow(radius / 1000, 2) * 0.95; // typical area clipped to city borders
  const cityArea = 686.67;

  for (const pos of list) {
    let geo = {
      alamat_lengkap: `Jl. Raya Padang, Kota Padang, Sumatera Barat`,
      kelurahan: "-",
      kecamatan: "-",
      kota: "Kota Padang",
      provinsi: "Sumatera Barat"
    };
    try {
      geo = await reverseGeocode(pos.lat, pos.lng);
    } catch (e) {
      console.error(e);
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(pos.lng), parseFloat(pos.lat)]
      },
      properties: {
        id: pos.id,
        no_pos: pos.no_pos,
        nama_lokasi: pos.nama_lokasi,
        google_maps_link: pos.google_maps_link || `https://www.google.com/maps?q=${pos.lat},${pos.lng}`,
        lat: parseFloat(pos.lat),
        lng: parseFloat(pos.lng),
        alamat_lengkap: geo.alamat_lengkap,
        kelurahan: geo.kelurahan,
        kecamatan: geo.kecamatan,
        kota: geo.kota,
        provinsi: geo.provinsi || "Sumatera Barat",
        area_km2: parseFloat(singleArea.toFixed(2)),
        persen_coverage: parseFloat(((singleArea / cityArea) * 100).toFixed(2)),
        radius_m: radius
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

// Helper function to clear recommendation cache on DB writes
function triggerCacheClear() {
  try {
    const rekomendasi = require('./rekomendasi');
    if (rekomendasi && typeof rekomendasi.clearCache === 'function') {
      rekomendasi.clearCache();
    }
  } catch (err) {
    console.error('Failed to trigger recommendation cache clear:', err.message);
  }
}

// Export mock list for other routes
router.getMockList = () => mockDamkarList;

// ============================================================
// GET /api/damkar → semua pos sebagai GeoJSON (untuk peta)
// Supports optional radius parameter to compute dynamic stats
// ============================================================
router.get('/', async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;
  try {
    const result = await pool.query(`
      WITH kota AS (
        SELECT ST_Union(geom) AS geom 
        FROM batas_wilayah
      )
      SELECT 
        d.id,
        d.no_pos,
        d.nama_lokasi,
        d.google_maps_link,
        ST_X(d.geom) AS lng,
        ST_Y(d.geom) AS lat,
        ROUND(ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography)::numeric/1000000, 2) AS area_km2,
        ROUND((ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography) / ST_Area(k.geom::geography) * 100)::numeric, 2) AS persen_coverage
      FROM data_damkar_padang d, kota k
      ORDER BY d.no_pos
    `, [radius]);

    if (result.rows && result.rows.length > 0) {
      const features = [];
      for (const row of result.rows) {
        const geo = await reverseGeocode(row.lat, row.lng);
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(row.lng), parseFloat(row.lat)]
          },
          properties: {
            id: row.id,
            no_pos: row.no_pos,
            nama_lokasi: row.nama_lokasi,
            google_maps_link: row.google_maps_link || `https://www.google.com/maps?q=${row.lat},${row.lng}`,
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lng),
            alamat_lengkap: geo.alamat_lengkap,
            kelurahan: geo.kelurahan,
            kecamatan: geo.kecamatan,
            kota: geo.kota,
            provinsi: geo.provinsi || "Sumatera Barat",
            area_km2: parseFloat(row.area_km2),
            persen_coverage: parseFloat(row.persen_coverage),
            radius_m: radius
          }
        });
      }
      return res.json({
        type: 'FeatureCollection',
        features
      });
    }
    throw new Error('Database returned empty result');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/damkar:', err.message);
    const mockGeoJSON = await convertToGeoJSON(mockDamkarList, radius);
    res.json(mockGeoJSON);
  }
});

// ============================================================
// GET /api/damkar/list?search=xxx&radius=xxx → semua pos (format tabel)
// ============================================================
router.get('/list', async (req, res) => {
  const search = req.query.search || '';
  const radius = parseInt(req.query.radius) || 3000;
  try {
    const result = await pool.query(`
      WITH kota AS (
        SELECT ST_Union(geom) AS geom 
        FROM batas_wilayah
      )
      SELECT 
        d.id,
        d.no_pos,
        d.nama_lokasi,
        d.google_maps_link,
        ST_Y(d.geom) AS lat,
        ST_X(d.geom) AS lng,
        ROUND(ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography)::numeric/1000000, 2) AS area_km2,
        ROUND((ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography) / ST_Area(k.geom::geography) * 100)::numeric, 2) AS persen_coverage
      FROM data_damkar_padang d, kota k
      WHERE 
        d.nama_lokasi ILIKE $2 OR 
        d.no_pos::text ILIKE $2
      ORDER BY d.no_pos
    `, [radius, `%${search}%`]);

    const enrichedRows = [];
    for (const row of result.rows) {
      const geo = await reverseGeocode(row.lat, row.lng);
      enrichedRows.push({
        ...row,
        google_maps_link: row.google_maps_link || `https://www.google.com/maps?q=${row.lat},${row.lng}`,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        alamat_lengkap: geo.alamat_lengkap,
        kelurahan: geo.kelurahan,
        kecamatan: geo.kecamatan,
        kota: geo.kota,
        area_km2: parseFloat(row.area_km2),
        persen_coverage: parseFloat(row.persen_coverage)
      });
    }
    res.json(enrichedRows);
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/damkar/list:', err.message);
    const filtered = mockDamkarList.filter(pos => 
      pos.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      pos.no_pos.toString().includes(search)
    ).sort((a, b) => parseInt(a.no_pos) - parseInt(b.no_pos));

    const singleArea = Math.PI * Math.pow(radius / 1000, 2) * 0.95;
    const cityArea = 686.67;

    const enrichedMock = [];
    for (const pos of filtered) {
      const geo = await reverseGeocode(pos.lat, pos.lng);
      enrichedMock.push({
        ...pos,
        google_maps_link: pos.google_maps_link || `https://www.google.com/maps?q=${pos.lat},${pos.lng}`,
        alamat_lengkap: geo.alamat_lengkap,
        kelurahan: geo.kelurahan,
        kecamatan: geo.kecamatan,
        kota: geo.kota,
        area_km2: parseFloat(singleArea.toFixed(2)),
        persen_coverage: parseFloat(((singleArea / cityArea) * 100).toFixed(2))
      });
    }
    res.json(enrichedMock);
  }
});

// ============================================================
// GET /api/damkar/:id → detail 1 pos
// ============================================================
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const radius = parseInt(req.query.radius) || 3000;
  try {
    const result = await pool.query(`
      WITH kota AS (
        SELECT ST_Union(geom) AS geom 
        FROM batas_wilayah
      )
      SELECT 
        d.id, d.no_pos, d.nama_lokasi, d.google_maps_link,
        ST_Y(d.geom) AS lat,
        ST_X(d.geom) AS lng,
        ROUND(ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography)::numeric/1000000, 2) AS area_km2,
        ROUND((ST_Area(ST_Intersection(ST_Buffer(d.geom::geography, $1)::geometry, k.geom)::geography) / ST_Area(k.geom::geography) * 100)::numeric, 2) AS persen_coverage
      FROM data_damkar_padang d, kota k
      WHERE d.id = $2
    `, [radius, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    const row = result.rows[0];
    const geo = await reverseGeocode(row.lat, row.lng);
    res.json({
      ...row,
      google_maps_link: row.google_maps_link || `https://www.google.com/maps?q=${row.lat},${row.lng}`,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      alamat_lengkap: geo.alamat_lengkap,
      kelurahan: geo.kelurahan,
      kecamatan: geo.kecamatan,
      kota: geo.kota,
      area_km2: parseFloat(row.area_km2),
      persen_coverage: parseFloat(row.persen_coverage)
    });
  } catch (err) {
    console.warn(`⚠️ Fallback to mock data for GET /api/damkar/${id}:`, err.message);
    const pos = mockDamkarList.find(p => p.id === id);
    if (!pos) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    const geo = await reverseGeocode(pos.lat, pos.lng);
    const singleArea = Math.PI * Math.pow(radius / 1000, 2) * 0.95;
    const cityArea = 686.67;

    res.json({
      ...pos,
      google_maps_link: pos.google_maps_link || `https://www.google.com/maps?q=${pos.lat},${pos.lng}`,
      alamat_lengkap: geo.alamat_lengkap,
      kelurahan: geo.kelurahan,
      kecamatan: geo.kecamatan,
      kota: geo.kota,
      area_km2: parseFloat(singleArea.toFixed(2)),
      persen_coverage: parseFloat(((singleArea / cityArea) * 100).toFixed(2))
    });
  }
});

// ============================================================
// POST /api/damkar → tambah pos baru (CREATE)
// ============================================================
router.post('/', async (req, res) => {
  const { nama_lokasi, no_pos, lat, lng, google_maps_link } = req.body;
  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO data_damkar_padang 
        (nama_lokasi, no_pos, google_maps_link, geom)
      VALUES 
        ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING id, nama_lokasi, no_pos
    `, [nama_lokasi, no_pos, google_maps_link, lng, lat]);

    triggerCacheClear();
    res.status(201).json({ 
      message: 'Pos damkar berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for POST /api/damkar:', err.message);
    const newId = mockDamkarList.length > 0 ? Math.max(...mockDamkarList.map(p => p.id)) + 1 : 1;
    const newPos = {
      id: newId,
      no_pos: no_pos,
      nama_lokasi,
      google_maps_link: google_maps_link || `https://www.google.com/maps?q=${lat},${lng}`,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    mockDamkarList.push(newPos);
    triggerCacheClear();
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
  const { nama_lokasi, no_pos, lat, lng, google_maps_link } = req.body;
  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' });
  }

  try {
    const result = await pool.query(`
      UPDATE data_damkar_padang SET
        nama_lokasi    = $1,
        no_pos         = $2,
        google_maps_link = $3,
        geom           = ST_SetSRID(ST_MakePoint($4, $5), 4326)
      WHERE id = $6
      RETURNING id, nama_lokasi, no_pos
    `, [nama_lokasi, no_pos, google_maps_link, lng, lat, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pos tidak ditemukan' });
    }
    triggerCacheClear();
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
      no_pos: no_pos,
      nama_lokasi,
      google_maps_link: google_maps_link || `https://www.google.com/maps?q=${lat},${lng}`,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    triggerCacheClear();
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
    triggerCacheClear();
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
    triggerCacheClear();
    res.json({
      message: `Pos "${removed.nama_lokasi}" berhasil dihapus (Mock)`,
      id: removed.id
    });
  }
});

module.exports = router;
