const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const damkar = require("./damkar");

// Helper: generate 64-point circle polygon coords (ring) untuk satu pos
function makeCircleRing(lng, lat, radiusMeters, nPoints = 64) {
  const coords = [];
  const latDeg = radiusMeters / 111320;
  const lngDeg = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= nPoints; i++) {
    const angle = (i * 2 * Math.PI) / nPoints;
    coords.push([
      lng + lngDeg * Math.cos(angle),
      lat + latDeg * Math.sin(angle),
    ]);
  }
  coords[nPoints] = coords[0]; // close
  return coords;
}

// Helper: apakah dua lingkaran beririsan?
function circlesOverlap(a, b, radius) {
  const dlat = a.lat - b.lat;
  const dlng =
    (a.lng - b.lng) * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const distDeg = Math.sqrt(dlat * dlat + dlng * dlng);
  const distMeters = distDeg * 111320;
  return distMeters < radius * 2;
}

// GET /api/coverage?radius=3000
// Mengembalikan UNION dari seluruh buffer pos damkar sebagai satu Feature
router.get("/", async (req, res) => {
  const radius = parseInt(req.query.radius) || 3000;

  try {
    const result = await pool.query(
      `
      SELECT json_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(
          ST_Union(ST_Buffer(geom::geography, $1)::geometry)
        )::json,
        'properties', json_build_object(
          'radius_m', $1,
          'jumlah_pos', COUNT(*),
          'luas_km2', ROUND(
            ST_Area(ST_Union(ST_Buffer(geom::geography, $1)::geometry)::geography)::numeric / 1000000, 2
          )
        )
      ) AS geojson
      FROM data_damkar_padang
    `,
      [radius],
    );

    if (
      result.rows[0] &&
      result.rows[0].geojson &&
      result.rows[0].geojson.geometry
    ) {
      return res.json(result.rows[0].geojson);
    }
    throw new Error("Database returned empty or invalid results");
  } catch (err) {
    console.warn(
      "⚠️ Fallback to mock data for GET /api/coverage:",
      err.message,
    );

    const mockList = damkar.getMockList();
    // Buat FeatureCollection individual (fallback tidak bisa union tanpa PostGIS)
    // tapi tampilkan sebagai array terpisah agar frontend bisa render semua buffer
    const features = mockList.map((pos) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [makeCircleRing(pos.lng, pos.lat, radius)],
      },
      properties: {
        id: pos.id,
        nama_lokasi: pos.nama_lokasi,
        radius_m: radius,
      },
    }));

    // Return sebagai FeatureCollection (Leaflet tidak support GeometryCollection langsung)
    res.json({
      type: "FeatureCollection",
      features,
      properties: {
        radius_m: radius,
        jumlah_pos: mockList.length,
        luas_km2: parseFloat(
          Math.min(
            686.67,
            mockList.length * Math.PI * Math.pow(radius / 1000, 2) * 0.85,
          ).toFixed(2),
        ),
      },
    });
  }
});

module.exports = router;
