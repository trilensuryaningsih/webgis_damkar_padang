# PRD & Panduan Pengembangan WebGIS
## Optimasi Blank Spot & Rekomendasi Lokasi Damkar Kota Padang

**Tim:** FIRE FORCE TEAM — Kelompok 1  
**Stack:** React + Express.js + PostgreSQL/PostGIS  
**Versi:** 1.0

---

## STATUS DATA (SUDAH SELESAI ✅)

```
✅ data_damkar_padang      → 7 titik pos damkar (POINT, SRID 4326)
✅ batas_wilayah           → 11 kecamatan Kota Padang (SRID 4326)
✅ jaringan_jalan          → polyline jalan dari OSM (SRID 4326)
✅ coverage_area           → buffer 3km tiap pos
✅ total_coverage          → gabungan semua coverage (146.56 km²)
✅ blank_spot              → area tidak terlayani (574.18 km² / 83.62%)
✅ kandidat_rekomendasi    → 5 titik kandidat lokasi baru
```

---

## BAGIAN 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 1.1 Tujuan Produk

Membangun sistem WebGIS berbasis web yang mampu:
1. Memvisualisasikan 7 pos damkar eksisting di Kota Padang beserta radius layanannya
2. Menampilkan **area blank spot** (574.18 km² / 83.62% wilayah tidak terlayani)
3. Memberikan **5 rekomendasi koordinat** penempatan pos baru berdasarkan analisis spasial PostGIS

---

### 1.2 Fungsionalitas Web (Apa yang Bisa Dilakukan Pengguna)

> Bagian ini menjelaskan semua fungsi yang tersedia di web dari sudut pandang pengguna.

---

#### 🗺️ F1 — Melihat Peta Interaktif Kota Padang

Pengguna dapat melihat peta Kota Padang berbasis OpenStreetMap yang bisa di-zoom, di-pan (geser), dan diinteraksikan secara langsung di browser. Peta menampilkan wilayah Kota Padang lengkap dengan nama jalan dan bangunan dari OpenStreetMap sebagai latar belakang.

---

#### 🚒 F2 — Melihat Lokasi 7 Pos Damkar Eksisting

Pengguna dapat melihat **7 marker merah** yang menunjukkan lokasi pos pemadam kebakaran yang saat ini beroperasi di Kota Padang. Setiap marker bisa **diklik** untuk memunculkan popup yang berisi:
- Nama lokasi pos damkar
- Nomor pos
- Link Google Maps

---

#### ✅ F3 — Melihat Area Jangkauan (Coverage) Tiap Pos

Pengguna dapat menampilkan **area hijau transparan** di sekitar setiap pos damkar yang merepresentasikan wilayah yang masih terjangkau dalam radius layanan. Secara default radius yang digunakan adalah **3 km** dari masing-masing pos.

---

#### 🔴 F4 — Melihat Area Blank Spot

Pengguna dapat menampilkan **area merah transparan** yang menunjukkan wilayah Kota Padang yang **tidak terlayani** oleh pos damkar manapun. Ini adalah fitur utama sistem — menunjukkan secara visual bahwa **574.18 km² (83.62%)** wilayah Padang masih berada di luar jangkauan proteksi.

---

#### 🎚️ F5 — Mengatur Radius Layanan Secara Dinamis

Pengguna dapat **menggeser slider** di sidebar untuk mengubah radius layanan dari **1 km hingga 10 km**. Saat slider digeser, peta akan **langsung memperbarui** tampilan area coverage dan blank spot secara real-time tanpa perlu reload halaman. Ini berguna untuk simulasi skenario:
- Jika radius diperbesar → blank spot mengecil
- Jika radius diperkecil → blank spot membesar

---

#### 🛣️ F6 — Menampilkan Jaringan Jalan Kota Padang

Pengguna dapat mengaktifkan layer jaringan jalan yang menampilkan **polyline abu-abu** mengikuti ruas jalan di Kota Padang. Layer ini membantu memahami aksesibilitas wilayah dan konteks geografis dari area blank spot yang ditampilkan.

---

#### 🔲 F7 — Toggle Layer On/Off

Pengguna dapat **mengaktifkan atau menonaktifkan** setiap layer peta secara independen melalui checkbox di sidebar:

| Checkbox | Efek |
|----------|------|
| ☑ Pos Damkar | Tampilkan/sembunyikan 7 marker damkar |
| ☑ Area Terlayani | Tampilkan/sembunyikan coverage hijau |
| ☑ Blank Spot | Tampilkan/sembunyikan area merah |
| ☑ Rekomendasi Lokasi | Tampilkan/sembunyikan kandidat lokasi baru |
| ☑ Jaringan Jalan | Tampilkan/sembunyikan polyline jalan |

---

#### 📊 F8 — Membaca Statistik Blank Spot

Pengguna dapat melihat **ringkasan statistik** di panel sidebar yang menampilkan:
- **Luas Kota Padang:** 686.67 km²
- **Jumlah Pos Damkar:** 7 pos
- **Area Terlayani:** 146.56 km²
- **Luas Blank Spot:** 574.18 km²
- **Persentase Blank Spot:** 83.62%

Angka-angka ini diambil langsung dari database PostGIS secara real-time.

---

#### 📍 F9 — Melihat Rekomendasi Lokasi Pos Baru

Pengguna dapat melihat **5 marker hijau** di peta yang merepresentasikan titik koordinat rekomendasi lokasi penempatan pos damkar baru. Rekomendasi ini dihasilkan dari algoritma spasial PostGIS yang mencari **centroid dari area blank spot terluas**. Setiap marker bisa diklik untuk melihat:
- Nama kandidat (Kandidat 1–5)
- Luas area blank spot yang akan terlayani (km²)
- Skor prioritas (0–100%)

---

#### 📋 F10 — Membaca List Rekomendasi di Sidebar

Selain marker di peta, pengguna juga dapat membaca **daftar 5 kandidat rekomendasi** di panel sidebar yang diurutkan berdasarkan skor prioritas tertinggi. Ini memudahkan perbandingan antar kandidat tanpa harus klik satu per satu di peta.

---

#### 🗄️ F11 — CRUD Data Pos Damkar

Pengguna (admin) dapat mengelola data pos damkar langsung dari web melalui halaman **Manajemen Data**. Semua perubahan data akan langsung tercermin di peta secara real-time.

| Operasi | Aksi | Detail |
|---------|------|--------|
| **Create** | Tambah pos baru | Isi form: nama lokasi, no pos, koordinat (lat/lng), link Google Maps → klik Simpan → marker baru muncul di peta |
| **Read** | Lihat daftar pos | Tabel berisi semua pos damkar dengan kolom: no pos, nama lokasi, koordinat, aksi |
| **Update** | Edit data pos | Klik tombol Edit pada baris tabel → form terisi otomatis dengan data lama → ubah → klik Simpan |
| **Delete** | Hapus pos | Klik tombol Hapus pada baris tabel → muncul konfirmasi → klik Ya → marker hilang dari peta |

> **Catatan:** Setelah operasi Create/Update/Delete, coverage area, blank spot, dan rekomendasi akan otomatis dihitung ulang di database agar data analisis tetap akurat.

---

#### 🔍 F12 — Searching Data Pos Damkar

Pengguna dapat **mencari pos damkar** dari kolom pencarian yang tersedia di halaman Manajemen Data maupun di sidebar peta.

**Searching di halaman Manajemen Data (tabel):**
- Ketik nama pos atau nomor pos di kolom search → tabel langsung filter secara real-time
- Contoh: ketik "koto" → hanya tampilkan pos yang mengandung kata "koto"

**Searching di peta (sidebar):**
- Ketik nama pos di search box sidebar → peta otomatis zoom ke lokasi pos yang dicari → marker berkedip/highlight

---

#### Ringkasan Fungsionalitas

```
INTERAKSI PETA
├── Zoom in/out peta
├── Geser/pan peta
├── Klik marker damkar → popup info pos
└── Klik marker rekomendasi → popup info kandidat

KONTROL LAYER (Sidebar)
├── Toggle checkbox 5 layer on/off
└── Slider radius 1–10 km → update peta real-time

INFORMASI (Sidebar)
├── 5 kartu statistik (luas kota, pos, terlayani, blankspot, persen)
├── List 5 kandidat rekomendasi + skor prioritas
└── Search box → zoom ke pos yang dicari

MANAJEMEN DATA (Halaman Admin)
├── Tabel semua pos damkar
├── Search/filter nama atau nomor pos
├── Tombol Tambah → form input pos baru
├── Tombol Edit → form edit data pos
└── Tombol Hapus → konfirmasi → hapus
```

---

### 1.3 Fitur & Prioritas

#### Module 1 — Peta Utama

| ID | Fitur | Prioritas |
|----|-------|-----------|
| F-01 | Peta dasar Kota Padang dengan tile OpenStreetMap | High |
| F-02 | Marker 7 pos damkar + popup (nama, alamat, no_pos) | High |
| F-03 | Layer coverage radius 3km tiap pos (hijau transparan) | High |
| F-04 | Layer blank spot (merah transparan) | High |
| F-05 | Layer jaringan jalan Kota Padang | Medium |
| F-06 | Toggle on/off tiap layer via sidebar | High |

#### Module 2 — Statistik Blank Spot

| ID | Fitur | Prioritas |
|----|-------|-----------|
| F-07 | Kartu statistik: luas kota, luas terlayani, luas blank spot, persentase | High |
| F-08 | Slider radius layanan (1–10 km) → update peta real-time | Medium |

#### Module 3 — Rekomendasi Lokasi

| ID | Fitur | Prioritas |
|----|-------|-----------|
| F-09 | Marker 5 kandidat rekomendasi di peta (warna berbeda) | High |
| F-10 | Popup tiap kandidat: nama, luas area, skor prioritas | High |
| F-11 | List kandidat di sidebar dengan skor prioritas | High |

#### Module 4 — CRUD Manajemen Data Pos Damkar

| ID | Fitur | Prioritas |
|----|-------|-----------|
| F-12 | Halaman tabel semua data pos damkar | High |
| F-13 | Form tambah pos baru (Create) → simpan ke DB → marker muncul di peta | High |
| F-14 | Form edit data pos (Update) → data lama auto-terisi di form | High |
| F-15 | Tombol hapus pos (Delete) → konfirmasi dialog → marker hilang dari peta | High |
| F-16 | Setelah Create/Update/Delete → recalculate coverage & blank spot otomatis | Medium |

#### Module 5 — Searching

| ID | Fitur | Prioritas |
|----|-------|-----------|
| F-17 | Search box di tabel manajemen data → filter real-time by nama/no_pos | High |
| F-18 | Search box di sidebar peta → zoom ke lokasi pos yang dicari | Medium |

---

### 1.4 Arsitektur Sistem

```
┌──────────────────────────────────┐
│         BROWSER (React)          │
│  ┌──────────────┐ ┌───────────┐  │
│  │ Leaflet Map  │ │  Sidebar  │  │
│  │   (Peta)     │ │  (Panel)  │  │
│  └──────┬───────┘ └─────┬─────┘  │
└─────────┼───────────────┼────────┘
          │   HTTP/REST   │
┌─────────▼───────────────▼────────┐
│        BACKEND (Express.js)      │
│  /api/damkar                     │
│  /api/blankspot                  │
│  /api/rekomendasi                │
│  /api/coverage                   │
│  /api/jalan                      │
│  /api/stats                      │
└──────────────────┬───────────────┘
                   │ node-postgres (pg)
┌──────────────────▼───────────────┐
│   DATABASE (PostgreSQL+PostGIS)  │
│  data_damkar_padang              │
│  batas_wilayah                   │
│  jaringan_jalan                  │
│  coverage_area                   │
│  blank_spot                      │
│  kandidat_rekomendasi            │
└──────────────────────────────────┘
```

---

### 1.5 API Endpoints

#### Endpoints Peta & Analisis

| Method | Endpoint | Deskripsi | Response |
|--------|----------|-----------|----------|
| GET | `/api/damkar` | Semua pos damkar | GeoJSON FeatureCollection |
| GET | `/api/coverage` | Buffer coverage tiap pos | GeoJSON FeatureCollection |
| GET | `/api/blankspot` | Polygon blank spot | GeoJSON Feature |
| GET | `/api/blankspot?radius=5000` | Blank spot dengan radius custom | GeoJSON Feature |
| GET | `/api/rekomendasi` | 5 kandidat lokasi baru | GeoJSON FeatureCollection |
| GET | `/api/jalan` | Jaringan jalan Padang | GeoJSON FeatureCollection |
| GET | `/api/stats` | Statistik lengkap (luas, persen) | JSON |

#### Endpoints CRUD Pos Damkar

| Method | Endpoint | Deskripsi | Body / Response |
|--------|----------|-----------|-----------------|
| GET | `/api/damkar/list` | Semua pos (format tabel, bukan GeoJSON) | JSON array |
| GET | `/api/damkar/list?search=koto` | Cari pos by nama atau no_pos | JSON array |
| GET | `/api/damkar/:id` | Detail 1 pos by ID | JSON object |
| POST | `/api/damkar` | Tambah pos baru | Body: `{nama_lokasi, no_pos, lat, lng, google_maps_li}` |
| PUT | `/api/damkar/:id` | Edit data pos | Body: `{nama_lokasi, no_pos, lat, lng, google_maps_li}` |
| DELETE | `/api/damkar/:id` | Hapus pos by ID | JSON: `{message, id}` |

---

### 1.6 Struktur Folder Proyek

```
webgis-damkar-padang/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── routes/
│   │   │   ├── damkar.js        ← GET GeoJSON + CRUD + Search
│   │   │   ├── blankspot.js
│   │   │   ├── rekomendasi.js
│   │   │   ├── jalan.js
│   │   │   └── stats.js
│   │   └── app.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── MapContainer.jsx
│   │   │   │   ├── DamkarMarkers.jsx
│   │   │   │   ├── CoverageLayer.jsx
│   │   │   │   ├── BlankSpotLayer.jsx
│   │   │   │   ├── JalanLayer.jsx
│   │   │   │   └── RekomendasiMarkers.jsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── LayerControl.jsx
│   │   │   │   ├── StatsPanel.jsx
│   │   │   │   ├── RekomendasiPanel.jsx
│   │   │   │   └── SearchBox.jsx        ← BARU (search di peta)
│   │   │   └── Admin/
│   │   │       ├── DamkarTable.jsx      ← BARU (tabel + search)
│   │   │       ├── DamkarForm.jsx       ← BARU (form create & edit)
│   │   │       └── DeleteConfirm.jsx    ← BARU (dialog konfirmasi hapus)
│   │   ├── pages/
│   │   │   ├── MapPage.jsx              ← BARU (halaman peta)
│   │   │   └── AdminPage.jsx            ← BARU (halaman manajemen data)
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## BAGIAN 2 — LANGKAH PENGEMBANGAN

---

## FASE 1 — Setup Project (Hari 1)

### Step 1.1 — Buat Struktur Folder

Buka terminal / CMD, arahkan ke folder yang kamu inginkan:

```bash
mkdir webgis-damkar-padang
cd webgis-damkar-padang
mkdir backend
mkdir frontend
```

---

### Step 1.2 — Setup Backend Express

```bash
cd backend
npm init -y
npm install express pg cors dotenv
npm install --save-dev nodemon
```

Edit `package.json`, tambahkan script:

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js"
  }
}
```

---

### Step 1.3 — Buat File .env

Buat file `.env` di dalam folder `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASS=password_kamu
DB_NAME=nama_database_kamu
DB_PORT=5432
```

---

### Step 1.4 — Buat File Koneksi Database

Buat file `backend/src/config/db.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Koneksi database gagal:', err.message);
  } else {
    console.log('✅ Database terhubung!');
  }
});

module.exports = pool;
```

---

### Step 1.5 — Buat Entry Point Express

Buat file `backend/src/app.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes (akan diisi bertahap)
app.use('/api/damkar', require('./routes/damkar'));
app.use('/api/coverage', require('./routes/coverage'));
app.use('/api/blankspot', require('./routes/blankspot'));
app.use('/api/rekomendasi', require('./routes/rekomendasi'));
app.use('/api/jalan', require('./routes/jalan'));
app.use('/api/stats', require('./routes/stats'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ WebGIS Damkar Padang API berjalan!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
```

---

### Step 1.6 — Setup Frontend React

```bash
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install leaflet react-leaflet axios
```

---

## FASE 2 — Backend API (Hari 2)

### Step 2.1 — Route Damkar (GeoJSON untuk Peta)

Buat file `backend/src/routes/damkar.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/damkar/list?search=xxx → semua pos (format tabel)
// Mendukung searching by nama_lokasi atau no_pos
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/damkar/:id → detail 1 pos
// ============================================================
router.get('/:id', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/damkar → tambah pos baru (CREATE)
// Body: { nama_lokasi, no_pos, lat, lng, google_maps_li }
// ============================================================
router.post('/', async (req, res) => {
  const { nama_lokasi, no_pos, lat, lng, google_maps_li } = req.body;

  // Validasi input
  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ 
      error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' 
    });
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /api/damkar/:id → edit data pos (UPDATE)
// Body: { nama_lokasi, no_pos, lat, lng, google_maps_li }
// ============================================================
router.put('/:id', async (req, res) => {
  const { nama_lokasi, no_pos, lat, lng, google_maps_li } = req.body;

  if (!nama_lokasi || !no_pos || !lat || !lng) {
    return res.status(400).json({ 
      error: 'nama_lokasi, no_pos, lat, dan lng wajib diisi' 
    });
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/damkar/:id → hapus pos (DELETE)
// ============================================================
router.delete('/:id', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.2 — Route Coverage

Buat file `backend/src/routes/coverage.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.3 — Route Blank Spot

Buat file `backend/src/routes/blankspot.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
      return res.json(result.rows[0].geojson);
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
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.4 — Route Rekomendasi

Buat file `backend/src/routes/rekomendasi.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.5 — Route Jalan

Buat file `backend/src/routes/jalan.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

> **Catatan:** Sesuaikan nama kolom `highway` dan `name` dengan hasil `SELECT * FROM jaringan_jalan LIMIT 1` di pgAdmin. Nama kolom bisa berbeda tergantung data OSM.

---

### Step 2.6 — Route Stats

Buat file `backend/src/routes/stats.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET statistik lengkap blank spot
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ROUND((SELECT ST_Area(ST_Union(geom)::geography)::numeric/1000000 
          FROM batas_wilayah), 2) AS luas_kota_km2,
        ROUND((SELECT ST_Area(geom::geography)::numeric/1000000 
          FROM total_coverage), 2) AS luas_terlayani_km2,
        ROUND((SELECT ST_Area(geom::geography)::numeric/1000000 
          FROM blank_spot), 2) AS luas_blankspot_km2,
        ROUND(
          (SELECT ST_Area(geom::geography)::numeric/1000000 FROM blank_spot) /
          (SELECT ST_Area(ST_Union(geom)::geography)::numeric/1000000 FROM batas_wilayah) 
          * 100, 2) AS persen_blankspot,
        (SELECT COUNT(*) FROM data_damkar_padang) AS jumlah_pos
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.7 — Test Semua API

Jalankan backend:

```bash
cd backend
npm run dev
```

Buka browser, test satu per satu:

```
http://localhost:5000/
http://localhost:5000/api/damkar
http://localhost:5000/api/coverage
http://localhost:5000/api/blankspot
http://localhost:5000/api/rekomendasi
http://localhost:5000/api/jalan
http://localhost:5000/api/stats
```

Semua harus return JSON. Kalau berhasil → lanjut ke Fase 3.

---

## FASE 3 — Frontend React + Leaflet (Hari 3–4)

### Step 3.1 — Buat File API Service

Buat file `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// --- Peta & Analisis ---
export const getDamkar       = ()              => API.get('/damkar');
export const getCoverage     = (radius = 3000) => API.get(`/coverage?radius=${radius}`);
export const getBlankspot    = (radius = 3000) => API.get(`/blankspot?radius=${radius}`);
export const getRekomendasi  = ()              => API.get('/rekomendasi');
export const getJalan        = ()              => API.get('/jalan');
export const getStats        = ()              => API.get('/stats');

// --- CRUD & Search ---
export const getDamkarList   = (search = '')   => API.get(`/damkar/list?search=${search}`);
export const getDamkarById   = (id)            => API.get(`/damkar/${id}`);
export const createDamkar    = (data)          => API.post('/damkar', data);
export const updateDamkar    = (id, data)      => API.put(`/damkar/${id}`, data);
export const deleteDamkar    = (id)            => API.delete(`/damkar/${id}`);
```

---

### Step 3.2 — Fix Leaflet Icon (Bug Umum React-Leaflet)

Tambahkan ini di `frontend/src/main.jsx`:

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Fix Leaflet marker icon bug di React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### Step 3.3 — Buat MapContainer Utama

Buat file `frontend/src/components/Map/MapContainer.jsx`:

```jsx
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DamkarMarkers from './DamkarMarkers';
import CoverageLayer from './CoverageLayer';
import BlankSpotLayer from './BlankSpotLayer';
import RekomendasiMarkers from './RekomendasiMarkers';
import JalanLayer from './JalanLayer';

const PadangMap = ({ layers, radius }) => {
  // Koordinat tengah Kota Padang
  const center = [-0.9492, 100.3543];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {layers.jalan      && <JalanLayer />}
      {layers.coverage   && <CoverageLayer radius={radius} />}
      {layers.blankspot  && <BlankSpotLayer radius={radius} />}
      {layers.damkar     && <DamkarMarkers />}
      {layers.rekomendasi && <RekomendasiMarkers />}
    </MapContainer>
  );
};

export default PadangMap;
```

---

### Step 3.4 — Buat DamkarMarkers

Buat file `frontend/src/components/Map/DamkarMarkers.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDamkar } from '../../services/api';

// Custom icon merah untuk pos damkar
const damkarIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DamkarMarkers = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDamkar().then(res => setData(res.data));
  }, []);

  if (!data) return null;

  return data.features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const { id, no_pos, nama_lokasi } = feature.properties;

    return (
      <Marker key={id} position={[lat, lng]} icon={damkarIcon}>
        <Popup>
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#dc2626' }}>
              🚒 {nama_lokasi}
            </h4>
            <p style={{ margin: 0 }}>No. Pos: {no_pos}</p>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default DamkarMarkers;
```

---

### Step 3.5 — Buat CoverageLayer

Buat file `frontend/src/components/Map/CoverageLayer.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getCoverage } from '../../services/api';

const CoverageLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getCoverage(radius).then(res => setData(res.data));
  }, [radius]);

  if (!data) return null;

  return (
    <GeoJSON
      key={`coverage-${radius}`}
      data={data}
      style={{
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.25,
        weight: 2
      }}
    />
  );
};

export default CoverageLayer;
```

---

### Step 3.6 — Buat BlankSpotLayer

Buat file `frontend/src/components/Map/BlankSpotLayer.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getBlankspot } from '../../services/api';

const BlankSpotLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getBlankspot(radius).then(res => setData(res.data));
  }, [radius]);

  if (!data) return null;

  return (
    <GeoJSON
      key={`blankspot-${radius}`}
      data={data}
      style={{
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        weight: 1
      }}
    />
  );
};

export default BlankSpotLayer;
```

---

### Step 3.7 — Buat RekomendasiMarkers

Buat file `frontend/src/components/Map/RekomendasiMarkers.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getRekomendasi } from '../../services/api';

// Custom icon hijau untuk rekomendasi
const rekomendasiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const RekomendasiMarkers = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRekomendasi().then(res => setData(res.data));
  }, []);

  if (!data) return null;

  return data.features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const { id, nama, luas_km2, skor_prioritas } = feature.properties;

    return (
      <Marker key={id} position={[lat, lng]} icon={rekomendasiIcon}>
        <Popup>
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#16a34a' }}>
              📍 {nama}
            </h4>
            <p style={{ margin: '2px 0' }}>Luas area: {luas_km2} km²</p>
            <p style={{ margin: '2px 0' }}>
              Skor prioritas: {(skor_prioritas * 100).toFixed(2)}%
            </p>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default RekomendasiMarkers;
```

---

### Step 3.8 — Buat JalanLayer

Buat file `frontend/src/components/Map/JalanLayer.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getJalan } from '../../services/api';

const JalanLayer = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getJalan().then(res => setData(res.data));
  }, []);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={{
        color: '#94a3b8',
        weight: 1,
        opacity: 0.6
      }}
    />
  );
};

export default JalanLayer;
```

---

## FASE 4 — Sidebar & Statistik (Hari 5)

### Step 4.1 — Buat StatsPanel

Buat file `frontend/src/components/Sidebar/StatsPanel.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getStats } from '../../services/api';

const StatsPanel = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(res => setStats(res.data));
  }, []);

  if (!stats) return <p>Memuat statistik...</p>;

  return (
    <div>
      <h3 style={{ marginBottom: '12px' }}>📊 Statistik Kota Padang</h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        <div className="stat-card">
          <span>Luas Kota</span>
          <strong>{stats.luas_kota_km2} km²</strong>
        </div>
        <div className="stat-card">
          <span>Jumlah Pos Damkar</span>
          <strong>{stats.jumlah_pos} Pos</strong>
        </div>
        <div className="stat-card" style={{ background: '#dcfce7' }}>
          <span>Area Terlayani</span>
          <strong>{stats.luas_terlayani_km2} km²</strong>
        </div>
        <div className="stat-card" style={{ background: '#fee2e2' }}>
          <span>Blank Spot</span>
          <strong>{stats.luas_blankspot_km2} km²</strong>
        </div>
        <div className="stat-card" style={{ background: '#fef9c3' }}>
          <span>Persentase Blank Spot</span>
          <strong>{stats.persen_blankspot}%</strong>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
```

---

### Step 4.2 — Buat LayerControl

Buat file `frontend/src/components/Sidebar/LayerControl.jsx`:

```jsx
const LayerControl = ({ layers, onToggle, radius, onRadiusChange }) => {
  const layerConfig = [
    { key: 'damkar',      label: '🚒 Pos Damkar',         color: '#dc2626' },
    { key: 'coverage',    label: '✅ Area Terlayani',      color: '#16a34a' },
    { key: 'blankspot',   label: '🔴 Blank Spot',          color: '#ef4444' },
    { key: 'rekomendasi', label: '📍 Rekomendasi Lokasi',  color: '#2563eb' },
    { key: 'jalan',       label: '🛣️ Jaringan Jalan',      color: '#64748b' },
  ];

  return (
    <div>
      <h3 style={{ marginBottom: '12px' }}>🗺️ Layer Peta</h3>
      {layerConfig.map(({ key, label, color }) => (
        <div key={key} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <input
            type="checkbox"
            checked={layers[key]}
            onChange={() => onToggle(key)}
            id={`layer-${key}`}
          />
          <label htmlFor={`layer-${key}`} style={{ color, cursor: 'pointer' }}>
            {label}
          </label>
        </div>
      ))}

      {/* Slider radius */}
      <div style={{ marginTop: '16px' }}>
        <label>
          <strong>Radius Layanan: {radius / 1000} km</strong>
        </label>
        <input
          type="range"
          min="1000"
          max="10000"
          step="500"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          style={{ width: '100%', marginTop: '4px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>1 km</span>
          <span>10 km</span>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;
```

---

### Step 4.3 — Buat RekomendasiPanel

Buat file `frontend/src/components/Sidebar/RekomendasiPanel.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getRekomendasi } from '../../services/api';

const RekomendasiPanel = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRekomendasi().then(res => setData(res.data));
  }, []);

  if (!data) return <p>Memuat rekomendasi...</p>;

  return (
    <div>
      <h3 style={{ marginBottom: '12px' }}>📍 Rekomendasi Lokasi Baru</h3>
      {data.features.map((f) => {
        const { id, nama, luas_km2, skor_prioritas } = f.properties;
        return (
          <div key={id} style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            background: '#f8fafc'
          }}>
            <div style={{ fontWeight: 'bold', color: '#16a34a' }}>{nama}</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Luas area: <strong>{luas_km2} km²</strong>
            </div>
            <div style={{ fontSize: '13px' }}>
              Prioritas: <strong>{(skor_prioritas * 100).toFixed(2)}%</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RekomendasiPanel;
```

---

### Step 4.4 — Buat Sidebar Utama

Buat file `frontend/src/components/Sidebar/Sidebar.jsx`:

```jsx
import StatsPanel from './StatsPanel';
import LayerControl from './LayerControl';
import RekomendasiPanel from './RekomendasiPanel';

const Sidebar = ({ layers, onToggle, radius, onRadiusChange }) => {
  return (
    <div style={{
      width: '300px',
      height: '100vh',
      overflowY: 'auto',
      background: '#ffffff',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      padding: '16px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        background: '#dc2626',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>🚒 WebGIS Damkar</h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
          Kota Padang — Blank Spot Analysis
        </p>
      </div>

      <StatsPanel />
      <LayerControl
        layers={layers}
        onToggle={onToggle}
        radius={radius}
        onRadiusChange={onRadiusChange}
      />
      <RekomendasiPanel />
    </div>
  );
};

export default Sidebar;
```

---

### Step 4.5 — Rakit di App.jsx

Edit file `frontend/src/App.jsx`:

```jsx
import { useState } from 'react';
import PadangMap from './components/Map/MapContainer';
import Sidebar from './components/Sidebar/Sidebar';

function App() {
  const [layers, setLayers] = useState({
    damkar: true,
    coverage: true,
    blankspot: true,
    rekomendasi: true,
    jalan: false,
  });

  const [radius, setRadius] = useState(3000);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        layers={layers}
        onToggle={toggleLayer}
        radius={radius}
        onRadiusChange={setRadius}
      />
      <div style={{ flex: 1 }}>
        <PadangMap layers={layers} radius={radius} />
      </div>
    </div>
  );
}

export default App;
```

---

### Step 4.6 — Tambahkan CSS Global

Edit file `frontend/src/index.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
}

.stat-card {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
```

---

## FASE 5 — Halaman Manajemen Data / Admin (Hari 6)

### Step 5.1 — Buat Tabel + Search (DamkarTable.jsx)

Buat file `frontend/src/components/Admin/DamkarTable.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { getDamkarList, deleteDamkar } from '../../services/api';

const DamkarTable = ({ onEdit, onRefresh, refresh }) => {
  const [data, setData]     = useState([]);
  const [search, setSearch] = useState('');

  // Fetch ulang setiap kali refresh berubah atau search berubah
  useEffect(() => {
    getDamkarList(search).then(res => setData(res.data));
  }, [search, refresh]);

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus pos "${nama}"? Aksi ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteDamkar(id);
      alert('Pos berhasil dihapus');
      onRefresh(); // trigger refresh di parent
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div>
      {/* Search Box */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="🔍 Cari nama pos atau no pos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Tabel */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#dc2626', color: 'white' }}>
            <th style={thStyle}>No Pos</th>
            <th style={thStyle}>Nama Lokasi</th>
            <th style={thStyle}>Lat</th>
            <th style={thStyle}>Lng</th>
            <th style={thStyle}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                {search ? 'Pos tidak ditemukan' : 'Belum ada data'}
              </td>
            </tr>
          ) : (
            data.map((pos) => (
              <tr key={pos.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>{pos.no_pos}</td>
                <td style={tdStyle}>{pos.nama_lokasi}</td>
                <td style={tdStyle}>{parseFloat(pos.lat).toFixed(5)}</td>
                <td style={tdStyle}>{parseFloat(pos.lng).toFixed(5)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => onEdit(pos)}
                    style={{ ...btnStyle, background: '#2563eb', marginRight: '6px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pos.id, pos.nama_lokasi)}
                    style={{ ...btnStyle, background: '#dc2626' }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = { padding: '10px 12px', textAlign: 'left' };
const tdStyle = { padding: '10px 12px' };
const btnStyle = {
  color: 'white', border: 'none', borderRadius: '4px',
  padding: '4px 10px', cursor: 'pointer', fontSize: '12px'
};

export default DamkarTable;
```

---

### Step 5.2 — Buat Form Create & Edit (DamkarForm.jsx)

Buat file `frontend/src/components/Admin/DamkarForm.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { createDamkar, updateDamkar } from '../../services/api';

// editData = null → mode Create, editData = {...} → mode Edit
const DamkarForm = ({ editData, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    nama_lokasi: '', no_pos: '', lat: '', lng: '', google_maps_li: ''
  });

  // Kalau mode edit, isi form dengan data lama
  useEffect(() => {
    if (editData) {
      setForm({
        nama_lokasi:    editData.nama_lokasi   || '',
        no_pos:         editData.no_pos        || '',
        lat:            editData.lat           || '',
        lng:            editData.lng           || '',
        google_maps_li: editData.google_maps_li || ''
      });
    } else {
      setForm({ nama_lokasi: '', no_pos: '', lat: '', lng: '', google_maps_li: '' });
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nama_lokasi || !form.no_pos || !form.lat || !form.lng) {
      alert('Nama lokasi, no pos, lat, dan lng wajib diisi!');
      return;
    }
    try {
      if (editData) {
        await updateDamkar(editData.id, form);
        alert('Pos berhasil diupdate!');
      } else {
        await createDamkar(form);
        alert('Pos baru berhasil ditambahkan!');
      }
      onSuccess(); // trigger refresh tabel
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: '8px', padding: '16px', marginBottom: '16px'
    }}>
      <h3 style={{ marginBottom: '12px', color: '#dc2626' }}>
        {editData ? '✏️ Edit Pos Damkar' : '➕ Tambah Pos Baru'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { name: 'nama_lokasi',    label: 'Nama Lokasi',    type: 'text' },
          { name: 'no_pos',         label: 'Nomor Pos',      type: 'text' },
          { name: 'lat',            label: 'Latitude',       type: 'number' },
          { name: 'lng',            label: 'Longitude',      type: 'number' },
        ].map(({ name, label, type }) => (
          <div key={name}>
            <label style={{ fontSize: '12px', color: '#64748b' }}>{label}</label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={name === 'lat' ? 'Contoh: -0.9492' : name === 'lng' ? 'Contoh: 100.3543' : ''}
              style={{
                width: '100%', padding: '7px 10px', marginTop: '2px',
                border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px'
              }}
            />
          </div>
        ))}
      </div>

      {/* Google Maps Link (full width) */}
      <div style={{ marginTop: '10px' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Link Google Maps (opsional)</label>
        <input
          type="text"
          name="google_maps_li"
          value={form.google_maps_li}
          onChange={handleChange}
          placeholder="https://maps.google.com/..."
          style={{
            width: '100%', padding: '7px 10px', marginTop: '2px',
            border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px'
          }}
        />
      </div>

      {/* Tombol Aksi */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit}
          style={{
            background: '#dc2626', color: 'white', border: 'none',
            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          {editData ? 'Simpan Perubahan' : 'Tambah Pos'}
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#94a3b8', color: 'white', border: 'none',
            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default DamkarForm;
```

---

### Step 5.3 — Buat Halaman Admin (AdminPage.jsx)

Buat file `frontend/src/pages/AdminPage.jsx`:

```jsx
import { useState } from 'react';
import DamkarTable from '../components/Admin/DamkarTable';
import DamkarForm  from '../components/Admin/DamkarForm';

const AdminPage = () => {
  const [showForm, setShowForm]  = useState(false);
  const [editData, setEditData]  = useState(null);  // null = mode Create
  const [refresh, setRefresh]    = useState(0);     // increment → trigger re-fetch tabel

  const handleTambah = () => {
    setEditData(null);   // mode Create
    setShowForm(true);
  };

  const handleEdit = (pos) => {
    setEditData(pos);    // mode Edit
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditData(null);
    setRefresh(r => r + 1); // trigger tabel refresh
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#dc2626' }}>🚒 Manajemen Data Pos Damkar</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            Kota Padang — Tambah, Edit, atau Hapus data pos damkar
          </p>
        </div>
        <button
          onClick={handleTambah}
          style={{
            background: '#dc2626', color: 'white', border: 'none',
            padding: '10px 18px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Tambah Pos Baru
        </button>
      </div>

      {/* Form Create/Edit (tampil jika showForm = true) */}
      {showForm && (
        <DamkarForm
          editData={editData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {/* Tabel + Search */}
      <DamkarTable
        onEdit={handleEdit}
        onRefresh={() => setRefresh(r => r + 1)}
        refresh={refresh}
      />
    </div>
  );
};

export default AdminPage;
```

---

### Step 5.4 — Buat Halaman Peta (MapPage.jsx)

Buat file `frontend/src/pages/MapPage.jsx`:

```jsx
import PadangMap from '../components/Map/MapContainer';
import Sidebar   from '../components/Sidebar/Sidebar';
import { useState } from 'react';

const MapPage = () => {
  const [layers, setLayers] = useState({
    damkar: true, coverage: true, blankspot: true,
    rekomendasi: true, jalan: false,
  });
  const [radius, setRadius] = useState(3000);

  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar layers={layers} onToggle={toggleLayer} radius={radius} onRadiusChange={setRadius} />
      <div style={{ flex: 1 }}>
        <PadangMap layers={layers} radius={radius} />
      </div>
    </div>
  );
};

export default MapPage;
```

---

### Step 5.5 — Rakit Navigasi di App.jsx (Peta ↔ Admin)

Edit file `frontend/src/App.jsx`:

```jsx
import { useState } from 'react';
import MapPage   from './pages/MapPage';
import AdminPage from './pages/AdminPage';

function App() {
  const [page, setPage] = useState('map'); // 'map' atau 'admin'

  return (
    <div>
      {/* Navbar sederhana */}
      <nav style={{
        background: '#dc2626', color: 'white',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', height: '48px', gap: '16px',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000
      }}>
        <span style={{ fontWeight: 'bold', marginRight: '16px' }}>🚒 WebGIS Damkar Padang</span>
        <button
          onClick={() => setPage('map')}
          style={{
            background: page === 'map' ? 'rgba(255,255,255,0.3)' : 'transparent',
            color: 'white', border: 'none', padding: '6px 14px',
            borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
          }}
        >
          🗺️ Peta
        </button>
        <button
          onClick={() => setPage('admin')}
          style={{
            background: page === 'admin' ? 'rgba(255,255,255,0.3)' : 'transparent',
            color: 'white', border: 'none', padding: '6px 14px',
            borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
          }}
        >
          🗄️ Manajemen Data
        </button>
      </nav>

      {/* Konten halaman */}
      <div style={{ paddingTop: '48px', height: '100vh' }}>
        {page === 'map'   && <MapPage />}
        {page === 'admin' && <AdminPage />}
      </div>
    </div>
  );
}

export default App;
```

---



### Cara Menjalankan Project

**Terminal 1 — Backend:**
```bash
cd webgis-damkar-padang/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd webgis-damkar-padang/frontend
npm run dev
```

Buka browser: `http://localhost:5173`

---

### Checklist Sebelum Presentasi

```
PETA
[ ] Peta Kota Padang tampil dengan tile OpenStreetMap
[ ] 7 marker pos damkar tampil (warna merah) dengan popup

LAYER
[ ] Layer coverage (hijau) toggle on/off berfungsi
[ ] Layer blank spot (merah) toggle on/off berfungsi
[ ] Layer jaringan jalan toggle on/off berfungsi
[ ] Layer rekomendasi (biru/hijau) toggle on/off berfungsi
[ ] Slider radius update peta secara real-time

SIDEBAR
[ ] Statistik luas kota tampil: 686.67 km²
[ ] Statistik blank spot tampil: 574.18 km² (83.62%)
[ ] List 5 kandidat rekomendasi tampil dengan skor
[ ] Semua layer control checkbox berfungsi

UMUM
[ ] Tidak ada error di browser console
[ ] Tampilan rapi di layar laptop (1366x768 ke atas)
```

---

## RINGKASAN TIMELINE

| Hari | Aktivitas | Output |
|------|-----------|--------|
| H1 | Fase 1: Setup folder, backend, frontend | Project bisa dijalankan |
| H2 | Fase 2: Semua API endpoint selesai | 6 endpoint return JSON |
| H3-4 | Fase 3: Semua layer Leaflet tampil di peta | Peta interaktif berjalan |
| H5 | Fase 4: Sidebar + statistik + layer control | UI lengkap |
| H6 | Fase 5: Testing + bug fix + polish | Siap presentasi ✅ |
