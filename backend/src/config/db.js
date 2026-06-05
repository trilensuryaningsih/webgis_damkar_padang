const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Koneksi ke database secara tangguh (tidak crash bila gagal)
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Koneksi database gagal:', err.message);
  } else {
    console.log('✅ Database terhubung!');
    release();
  }
});

module.exports = pool;
