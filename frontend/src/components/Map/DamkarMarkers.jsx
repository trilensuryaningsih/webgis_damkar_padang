import { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getDamkar } from "../../services/api";
import { IconFiretruck, IconExternalLink } from "../Icons";

// Normal pin icon
const createDamkarIcon = (isSelected = false) => {
  const size = isSelected ? 34 : 24;
  const glowColor = isSelected
    ? "rgba(239,68,68,1)"
    : "rgba(239,68,68,0.65)";
  const borderColor = isSelected ? "#fff" : "rgba(255,255,255,0.85)";
  const borderWidth = isSelected ? 3 : 2;
  const pulse = isSelected
    ? `animation: markerPulse 1.4s ease-in-out infinite;`
    : "";

  return L.divIcon({
    className: "custom-pin-marker",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:linear-gradient(135deg,#ef4444,#b91c1c);
        box-shadow:0 0 ${isSelected ? 20 : 10}px ${glowColor}, 0 2px 6px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        border:${borderWidth}px solid ${borderColor};
        ${pulse}
        position:relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 16 : 12}" height="${isSelected ? 16 : 12}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
        ${isSelected ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(239,68,68,0.4);animation:markerRing 1.4s ease-in-out infinite;"></div>` : ""}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  });
};

const MarkerItem = ({ feature, selectedDamkarId, onMarkerClick }) => {
  const [lng, lat] = feature.geometry.coordinates;
  const {
    id,
    no_pos,
    nama_lokasi,
    google_maps_link,
    alamat_lengkap,
    kelurahan,
    kecamatan,
    area_km2,
    persen_coverage,
    radius_m
  } = feature.properties;
  const markerRef = useRef(null);
  const isSelected = selectedDamkarId === id;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      setTimeout(() => {
        markerRef.current?.openPopup();
      }, 300);
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={createDamkarIcon(isSelected)}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: () => {
          if (onMarkerClick) onMarkerClick(feature);
        },
      }}
    >
      <Popup>
        <div style={{ textAlign: "left", minWidth: "200px" }}>
          <h4
            style={{
              margin: "0 0 8px",
              color: "var(--text-white)",
              fontSize: "13px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg,#ef4444,#b91c1c)",
                color: "#fff",
                borderRadius: "5px",
                padding: "1px 7px",
                fontSize: "10px",
                fontWeight: "800",
                flexShrink: 0,
              }}
            >
              🚒 Pos {no_pos}
            </span>
            {nama_lokasi}
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "11px",
            }}
          >
            {alamat_lengkap && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "9px", fontWeight: "600", textTransform: "uppercase" }}>Alamat:</span>
                <span style={{ color: "var(--text-main)", lineHeight: "1.3" }}>{alamat_lengkap}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Koordinat:</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Cakupan Area:</span>
              <strong style={{ color: "var(--accent)" }}>
                {area_km2 ? `${area_km2.toFixed(2)} km² (${persen_coverage.toFixed(2)}%)` : "—"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Status:</span>
              <span
                style={{
                  color: "var(--success)",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--success)",
                    display: "inline-block",
                  }}
                ></span>
                Aktif
              </span>
            </div>
          </div>
          {google_maps_link && (
            <a
              href={google_maps_link}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "10px",
                fontSize: "11px",
                color: "#3b82f6",
                fontWeight: "600",
                textDecoration: "none",
                background: "var(--accent-light)",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <IconExternalLink size={11} color="#3b82f6" /> Buka di Google Maps
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const DamkarMarkers = ({ selectedDamkarId, onMarkerClick, refresh, radius = 3000 }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDamkar(radius)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching fire stations:", err));
  }, [refresh, radius]);

  if (!data || !data.features) return null;

  return (
    <>
      {data.features.map((feature) => (
        <MarkerItem
          key={feature.properties.id}
          feature={feature}
          selectedDamkarId={selectedDamkarId}
          onMarkerClick={onMarkerClick}
        />
      ))}
    </>
  );
};

export default DamkarMarkers;
