import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { getBlankspot } from "../../services/api";

const BlankSpotLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadBlankspot = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setData(null);
      try {
        const res = await getBlankspot(radius);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) console.error("Error fetching blankspots:", err);
      }
    };

    loadBlankspot();
    return () => {
      cancelled = true;
    };
  }, [radius]);

  if (!data) return null;

  // Jika fully_covered, tidak perlu render apapun
  if (data.properties && data.properties.fully_covered) return null;

  // Jika geometry kosong
  if (
    !data.geometry ||
    (data.geometry.coordinates && data.geometry.coordinates.length === 0)
  )
    return null;

  const geojsonData =
    data.type === "FeatureCollection"
      ? data
      : {
          type: "FeatureCollection",
          features: [data],
        };

  return (
    <GeoJSON
      key={`blankspot-${radius}-${data.properties?.luas_km2 ?? "x"}`}
      data={geojsonData}
      style={{
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.32,
        weight: 1,
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties) {
          layer.bindTooltip(
            `Area Blank Spot: ${feature.properties.luas_km2} km²`,
            { sticky: true, className: "leaflet-tooltip-blankspot" },
          );
        }
      }}
    />
  );
};

export default BlankSpotLayer;
