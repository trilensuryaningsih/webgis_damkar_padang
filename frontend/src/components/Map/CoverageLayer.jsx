import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { getCoverage } from "../../services/api";

const CoverageLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null); // reset saat radius berubah agar layer lama hilang
    getCoverage(radius)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching coverage:", err));
  }, [radius]);

  if (!data) return null;

  // Normalize: bisa berupa Feature tunggal (dari DB union) atau FeatureCollection (fallback)
  const geojsonData =
    data.type === "FeatureCollection"
      ? data
      : {
          type: "FeatureCollection",
          features: [data],
        };

  return (
    <GeoJSON
      key={`coverage-${radius}-${data.properties?.luas_km2 ?? data.features?.length ?? 0}`}
      data={geojsonData}
      style={{
        color: "#16a34a",
        fillColor: "#22c55e",
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: null,
      }}
    />
  );
};

export default CoverageLayer;
