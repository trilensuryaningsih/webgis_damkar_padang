const { Pool } = require('pg');
require('dotenv').config();

// Supabase pooler memerlukan connectionString lengkap dengan user format: postgres.PROJECT_REF
// Coba connection string dulu, jika tidak ada fallback ke parameter individual
const connectionString = process.env.DATABASE_URL || null;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 5432,
      ssl: { rejectUnauthorized: false }
    });

// Koneksi ke database secara tangguh (tidak crash bila gagal)
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Koneksi database gagal:', err.message);
    console.error('💡 Pastikan DATABASE_URL atau parameter DB_* di .env sudah benar.');
    console.error('   Untuk Supabase pooler, format user harus: postgres.YOUR_PROJECT_REF');
  } else {
    console.log('✅ Database terhubung!');
    release();
  }
});

module.exports = pool;
