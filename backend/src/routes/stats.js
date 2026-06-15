const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const damkar = require('./damkar');

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
    if (result.rows[0] && result.rows[0].luas_kota_km2) {
      return res.json(result.rows[0]);
    }
    throw new Error('Database stats query returned empty row');
  } catch (err) {
    console.warn('⚠️ Fallback to mock data for GET /api/stats:', err.message);
    
    // Dynamically calculate based on in-memory mock damkar list
    const mockList = damkar.getMockList();
    const jumlah_pos = mockList.length;
    const luas_kota_km2 = 686.67;
    // Radius default 3000m (3km) -> 28.27km2 per pos. Let's account for overlay factor of 0.8
    const singleArea = Math.PI * 3 * 3; // ~28.27
    const luas_terlayani_km2 = parseFloat(Math.min(luas_kota_km2, jumlah_pos * singleArea * 0.8).toFixed(2));
    const luas_blankspot_km2 = parseFloat(Math.max(0, luas_kota_km2 - luas_terlayani_km2).toFixed(2));
    const persen_blankspot = parseFloat(((luas_blankspot_km2 / luas_kota_km2) * 100).toFixed(2));

    res.json({
      luas_kota_km2,
      luas_terlayani_km2,
      luas_blankspot_km2,
      persen_blankspot,
      jumlah_pos
    });
  }
});

module.exports = router;

