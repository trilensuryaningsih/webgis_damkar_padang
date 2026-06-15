const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");

// GET /api/stats?radius=3000
router.get("/", async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  try {
    const result = await pool.query(
      `
      WITH
        kota AS (
          SELECT ST_Union(geom) AS geom FROM batas_wilayah
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
      [radius],
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
