const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");

// GET /api/stats?radius=3000
router.get("/", async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;
  const PADANG_LAND_WKT = 'POLYGON((100.3020 -0.7930, 100.3090 -0.8100, 100.3150 -0.8250, 100.3220 -0.8400, 100.3300 -0.8600, 100.3350 -0.8750, 100.3410 -0.8900, 100.3450 -0.9050, 100.3490 -0.9200, 100.3540 -0.9400, 100.3590 -0.9600, 100.3650 -0.9800, 100.3700 -0.9950, 100.3750 -1.0100, 100.3800 -1.0250, 100.3880 -1.0450, 100.3780 -1.0650, 100.3750 -1.0800, 100.4134 -1.0512, 100.4534 -1.0212, 100.4934 -0.9912, 100.5234 -0.9512, 100.5312 -0.9112, 100.5234 -0.8712, 100.5012 -0.8312, 100.4712 -0.8034, 100.4312 -0.7891, 100.3891 -0.7712, 100.3512 -0.7589, 100.3020 -0.7930))';

  try {
    const result = await pool.query(
      `
      WITH
        kota AS (
          SELECT ST_Intersection(ST_Union(geom), ST_GeomFromText($2, 4326)) AS geom 
          FROM batas_wilayah
        ),
        coverage AS (
          SELECT ST_Union(ST_Buffer(geom::geography, $1)::geometry) AS geom
          FROM data_damkar_padang
        ),
        coverage_clipped AS (
          SELECT ST_Intersection(k.geom, c.geom) AS geom
          FROM kota k CROSS JOIN coverage c
        ),
        blankspot AS (
          SELECT ST_Difference(k.geom, c.geom) AS geom
          FROM kota k CROSS JOIN coverage c
        )
      SELECT
        ROUND(ST_Area(k.geom::geography)::numeric / 1000000, 2)            AS luas_kota_km2,
        ROUND(ST_Area(cc.geom::geography)::numeric / 1000000, 2)           AS luas_terlayani_km2,
        ROUND(ST_Area(b.geom::geography)::numeric / 1000000, 2)            AS luas_blankspot_km2,
        ROUND(ST_Area(b.geom::geography)::numeric /
              ST_Area(k.geom::geography)::numeric * 100, 2)                AS persen_blankspot,
        ROUND(ST_Area(cc.geom::geography)::numeric /
              ST_Area(k.geom::geography)::numeric * 100, 2)                AS persen_terlayani,
        (SELECT COUNT(*) FROM data_damkar_padang)                          AS jumlah_pos,
        $1                                                                  AS radius_used
      FROM kota k, coverage_clipped cc, blankspot b
    `,
      [radius, PADANG_LAND_WKT],
    );

    if (result.rows[0] && result.rows[0].luas_kota_km2) {
      return res.json(result.rows[0]);
    }
    throw new Error("Database stats query returned empty row");
  } catch (err) {
    console.warn("⚠️ Fallback to mock data for GET /api/stats:", err.message);

    const mockList = damkar.getMockList();
    const jumlah_pos = mockList.length;
    const luas_kota_km2 = 686.67;
    const singleArea = Math.PI * Math.pow(radius / 1000, 2);
    const luas_terlayani_km2 = parseFloat(
      Math.min(luas_kota_km2, jumlah_pos * singleArea * 0.85).toFixed(2),
    );
    const luas_blankspot_km2 = parseFloat(
      Math.max(0, luas_kota_km2 - luas_terlayani_km2).toFixed(2),
    );
    const persen_blankspot = parseFloat(
      ((luas_blankspot_km2 / luas_kota_km2) * 100).toFixed(2),
    );
    const persen_terlayani = parseFloat((100 - persen_blankspot).toFixed(2));

    res.json({
      luas_kota_km2,
      luas_terlayani_km2,
      luas_blankspot_km2,
      persen_blankspot,
      persen_terlayani,
      jumlah_pos,
      radius_used: radius,
    });
  }
});

module.exports = router;
