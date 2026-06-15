# Panduan Setup Proyek WebGIS Damkar Padang

Dokumen ini menjelaskan langkah-langkah lengkap untuk melakukan inisialisasi, instalasi dependensi, konfigurasi database, dan menjalankan proyek WebGIS Damkar Padang dari nol.

---

## 📋 Prasyarat Sistem
Sebelum memulai, pastikan sistem Anda sudah menginstal perangkat lunak berikut:
1. **Node.js** (Versi 18.0.0 ke atas)
2. **PostgreSQL** (Versi 14 ke atas) beserta ekstensi **PostGIS**
3. **npm** (biasanya otomatis terinstal bersama Node.js)

---

## 📁 Struktur Folder Proyek
Proyek ini menggunakan arsitektur monorepo sederhana dengan pembagian folder sebagai berikut:
```text
webgis-damkar-padang/ (Root Workspace)
├── backend/            # Aplikasi Express.js (REST API & Spasial Query)
│   ├── src/
│   │   ├── config/     # Konfigurasi Koneksi Database
│   │   ├── routes/     # Routing API Endpoint (GeoJSON & CRUD)
│   │   └── app.js      # Main Entry Point Express
│   ├── .env            # Konfigurasi Kredensial Database & Port
│   └── package.json
├── frontend/           # Aplikasi React.js + Vite (User Interface & Map)
│   ├── src/
│   │   ├── components/ # Komponen Reusable (Map, Sidebar, Admin)
│   │   ├── pages/      # Halaman Utama (MapPage & AdminPage)
│   │   ├── services/   # Axios Client Integration
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 🛠️ Langkah-Langkah Setup

### Langkah 1: Clone / Siapkan Workspace
Arahkan terminal ke direktori proyek:
```bash
cd webgis-damkar-padang
```

---

### Langkah 2: Setup Database (PostgreSQL + PostGIS)
1. Buka **pgAdmin** atau terminal client PostgreSQL Anda.
2. Buat database baru, misalnya `damkar_padang_db`.
3. Jalankan perintah SQL berikut untuk mengaktifkan ekstensi spasial **PostGIS**:
   ```sql
   CREATE EXTENSION postgis;
   ```
4. Buat tabel-tabel utama yang dibutuhkan (skema dasar sesuai spasial):
   ```sql
   -- 1. Tabel Pos Damkar Eksisting
   CREATE TABLE data_damkar_padang (
       id SERIAL PRIMARY KEY,
       no_pos INTEGER NOT NULL,
       nama_lokasi VARCHAR(255) NOT NULL,
       google_maps_li TEXT,
       geom GEOMETRY(Point, 4326)
   );

   -- 2. Tabel Batas Wilayah Kecamatan
   CREATE TABLE batas_wilayah (
       id SERIAL PRIMARY KEY,
       kecamatan VARCHAR(100),
       geom GEOMETRY(MultiPolygon, 4326)
   );

   -- 3. Tabel Jaringan Jalan Kota Padang
   CREATE TABLE jaringan_jalan (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255),
       highway VARCHAR(50),
       geom GEOMETRY(MultiLineString, 4326)
   );
   ```

---

### Langkah 3: Setup & Konfigurasi Backend
1. Masuk ke folder `backend/`:
   ```bash
   cd backend
   ```
2. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
3. Sesuaikan file konfigurasi environment `backend/.env`. Ubah nilai variabel berikut sesuai dengan konfigurasi PostgreSQL lokal Anda:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASS=password_anda
   DB_NAME=damkar_padang_db
   DB_PORT=5432
   ```

---

### Langkah 4: Setup & Konfigurasi Frontend
1. Buka terminal baru dan masuk ke folder `frontend/`:
   ```bash
   cd ../frontend
   ```
2. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
3. *(Opsional)* Jika backend berjalan di luar port `5000`, buat file `.env` di folder `frontend` dan tambahkan variabel environment berikut:
   ```env
   VITE_API_URL=http://localhost:[PORT_BACKEND]/api
   ```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend (Express.js)
Di terminal folder `backend/`:
```bash
npm run dev
```
*Server akan mendengarkan di `http://localhost:5000`. Uji dengan membuka `http://localhost:5000/` di browser.*

### 2. Menjalankan Frontend (Vite + React)
Di terminal folder `frontend/`:
```bash
npm run dev
```
*Server development akan mendengarkan di `http://localhost:5173`. Buka alamat tersebut di browser Anda untuk menggunakan aplikasi.*
