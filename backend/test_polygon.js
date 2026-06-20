const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log("Mencoba koneksi dengan ConnectionString ke Supabase...");
    const res = await pool.query('SELECT version()');
    console.log('Koneksi sukses! Versi database:', res.rows[0].version);

    // Mari test validitas polygon kita
    const wkt = 'POLYGON((100.3060 -0.7930, 100.3150 -0.8150, 100.3240 -0.8350, 100.3420 -0.8750, 100.3480 -0.8920, 100.3540 -0.9120, 100.3660 -0.9580, 100.3750 -1.0020, 100.3920 -1.0410, 100.3850 -1.0800, 100.4134 -1.0512, 100.4534 -1.0212, 100.4934 -0.9912, 100.5234 -0.9512, 100.5312 -0.9112, 100.5234 -0.8712, 100.5012 -0.8312, 100.4712 -0.8034, 100.4312 -0.7891, 100.3891 -0.7712, 100.3512 -0.7589, 100.3060 -0.7930))';
    const valRes = await pool.query('SELECT ST_IsValid(ST_GeomFromText($1, 4326)) AS is_valid, ST_IsValidReason(ST_GeomFromText($1, 4326)) AS reason', [wkt]);
    console.log('Polygon valid?', valRes.rows[0].is_valid);
    console.log('Reason if invalid:', valRes.rows[0].reason);

  } catch (err) {
    console.error('Koneksi gagal:', err.message);
  } finally {
    await pool.end();
  }
}

run();
