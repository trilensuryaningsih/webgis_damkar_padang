import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { getCoverage } from "../../services/api";

// Batas darat Kota Padang (lng, lat) — sama dengan yang dipakai backend.
// Dipakai sebagai ring luar; lingkaran coverage menjadi "lubang".
const PADANG_BOUNDARY = [
  [100.302, -0.793],
  [100.309, -0.81],
  [100.315, -0.825],
  [100.322, -0.84],
  [100.33, -0.86],
  [100.335, -0.875],
  [100.341, -0.89],
  [100.345, -0.905],
  [100.349, -0.92],
  [100.354, -0.94],
  [100.359, -0.96],
  [100.365, -0.98],
  [100.37, -0.995],
  [100.375, -1.01],
  [100.38, -1.025],
  [100.388, -1.045],
  [100.378, -1.065],
  [100.375, -1.08],
  [100.4134, -1.0512],
  [100.4534, -1.0212],
  [100.4934, -0.9912],
  [100.5234, -0.9512],
  [100.5312, -0.9112],
  [100.5234, -0.8712],
  [100.5012, -0.8312],
  [100.4712, -0.8034],
  [100.4312, -0.7891],
  [100.3891, -0.7712],
  [100.3512, -0.7589],
  [100.302, -0.793],
];

// Ambil semua outer ring dari geometri coverage (Polygon / MultiPolygon /
// FeatureCollection fallback). Ring-ring ini dipakai sebagai lubang.
function extractCoverageRings(coverage) {
  const rings = [];
  const pushGeom = (geom) => {
    if (!geom) return;
    if (geom.type === "Polygon") {
      if (geom.coordinates[0]) rings.push(geom.coordinates[0]);
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((poly) => {
        if (poly[0]) rings.push(poly[0]);
      });
    }
  };

  if (coverage.type === "FeatureCollection") {
    (coverage.features || []).forEach((f) => pushGeom(f.geometry));
  } else if (coverage.type === "Feature") {
    pushGeom(coverage.geometry);
  } else {
    pushGeom(coverage);
  }
  return rings;
}

const BlankSpotLayer = ({ radius }) => {
  const [coverage, setCoverage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setCoverage(null);
      try {
        const res = await getCoverage(radius);
        if (!cancelled) setCoverage(res.data);
      } catch (err) {
        if (!cancelled) console.error("Error fetching coverage:", err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [radius]);

  if (!coverage) return null;

  const holes = extractCoverageRings(coverage);

  // Blank spot = batas kota (ring luar) − coverage (lubang).
  // Karena coverage berasal dari pos asli, lubang dijamin pas dengan marker.
  const geojsonData = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [PADANG_BOUNDARY, ...holes],
    },
  };

  return (
    <GeoJSON
      key={`blankspot-${radius}-${holes.length}`}
      data={geojsonData}
      style={{
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.32,
        weight: 1,
      }}
    />
  );
};

export default BlankSpotLayer;
