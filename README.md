# WebGIS Damkar Padang - Setup & Run Guide

Dokumen ini berisi panduan untuk menjalankan backend dan frontend proyek WebGIS Damkar Padang.

## Prasyarat
- Node.js (v18 ke atas)
- PostgreSQL dengan ekstensi PostGIS (untuk integrasi data spasial)

---

## Cara Menjalankan Project

Proyek ini terbagi menjadi dua bagian: **Backend** (Express.js) dan **Frontend** (Vite + React). Anda memerlukan dua terminal terpisah untuk menjalankan keduanya secara bersamaan.

### 1. Menjalankan Backend (Express.js)

Buka terminal, masuk ke folder `backend` dan jalankan server dalam mode development:

```bash
cd backend
npm run dev
```

- Server backend akan berjalan di: `http://localhost:5000`
- Anda dapat menguji status server dengan mengunjungi `http://localhost:5000/` di browser Anda.

> **Catatan Konfigurasi Database:**
> Sebelum menghubungkan database, ubah isi file [.env](file:///d:/TB%20aspas/backend/.env) di dalam folder `backend/` untuk menyesuaikan dengan kredensial PostgreSQL/PostGIS lokal Anda:
> ```env
> DB_HOST=localhost
> DB_USER=postgres
> DB_PASS=password_kamu
> DB_NAME=nama_database_kamu
> DB_PORT=5432
> ```

---

### 2. Menjalankan Frontend (Vite + React)

Buka terminal kedua, masuk ke folder `frontend` dan jalankan server development Vite:

```bash
cd frontend
npm run dev
```

- Aplikasi web frontend akan berjalan di: `http://localhost:5173`
- Buka browser Anda dan akses `http://localhost:5173` untuk melihat tampilan awal React.
