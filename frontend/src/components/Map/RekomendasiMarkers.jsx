import { useEffect, useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getRekomendasi } from "../../services/api";
import { IconClose, IconNavigation, IconPin } from "../Icons";

const createNumberedIcon = (number, isSelected = false) => {
  const size = isSelected ? 34 : 26;
  const glowIntensity = isSelected ? "0 0 24px rgba(16,185,129,0.9), 0 0 8px rgba(16,185,129,0.5)" : "0 0 12px rgba(16,185,129,0.7),0 2px 4px rgba(0,0,0,0.3)";
  const borderWidth = isSelected ? 3 : 2;
  const fontSize = isSelected ? 13 : 11;

  return L.divIcon({
    className: "custom-pin-marker",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:linear-gradient(135deg,#10b981,#059669);
        box-shadow:${glowIntensity};
        display:flex;align-items:center;justify-content:center;
        border:${borderWidth}px solid rgba(255,255,255,0.9);
        font-size:${fontSize}px;font-weight:800;color:#fff;
        font-family:Inter,system-ui,sans-serif;
        position:relative;
        ${isSelected ? "animation: markerPulse 1.4s ease-in-out infinite;" : ""}
      ">
        ${number}
        ${isSelected ? `<div style="position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(16,185,129,0.4);animation:markerRing 1.4s ease-in-out infinite;"></div>` : ""}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  });
};

const RekomendasiMarkers = ({
  refresh,
  radius = 3000,
  selectedRekomendasiId,
  onMarkerClick,
  onRouteRequest,
  onRouteCancel,
  routing,
  routeActive,
  routeOriginKey,
  onSetRouteOrigin,
  onPointClick,
}) => {
  const [data, setData] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    const loadRecommendations = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setData(null);
      try {
        const res = await getRekomendasi(radius);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching recommendations:", err);
        }
      }
    };

    loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, [refresh, radius]);

  useEffect(() => {
    if (selectedRekomendasiId && markerRefs.current[selectedRekomendasiId]) {
      setTimeout(() => {
        markerRefs.current[selectedRekomendasiId]?.openPopup();
      }, 300);
    }
  }, [selectedRekomendasiId]);

  if (!data || !data.features) return null;

  return data.features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    const isRouteOrigin = routeOriginKey === `rekomendasi:${p.id}`;
    const isSelected = selectedRekomendasiId === p.id || isRouteOrigin;
    const hasActiveRoute = routeActive && selectedRekomendasiId === p.id;
    const kontribusi = Number(p.kontribusi_km2 ?? p.luas_km2) || 0;
    const persenKontribusi = Number(p.persen_kontribusi) || 0;
    const blankSebelum = Number(p.luas_blankspot_sebelum_km2) || 0;
    const blankSesudah = Number(p.luas_blankspot_sesudah_km2) || 0;
    const blankTeratasi = parseFloat((blankSebelum - blankSesudah).toFixed(2));
    const jarakPosTerdekat = Number(p.jarak_pos_terdekat_km) || 0;
    const jarakPermukiman = Number(p.jarak_permukiman_km) || 0;
    const jarakJalan = Number(p.jarak_jalan_km) || 0;

    return (
      <Marker
        key={`rek-${p.id}-${radius}`}
        ref={(ref) => {
          if (ref) markerRefs.current[p.id] = ref;
        }}
        position={[lat, lng]}
        icon={createNumberedIcon(p.pos_ke || p.id, isSelected)}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{
          click: () => {
            if (onMarkerClick) onMarkerClick(feature);
            onPointClick?.(feature, "rekomendasi");
          },
        }}
      >
        <Popup>
          <div style={{ textAlign: "left", minWidth: "200px" }}>
            <h4
              style={{
                margin: "0 0 8px",
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--text-white)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                paddingBottom: "8px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  color: "#fff",
                  borderRadius: "5px",
                  padding: "1px 7px",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                <IconPin size={12} />
                Prioritas {p.pos_ke || p.id}
              </span>
              {p.nama}
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "11px",
              }}
            >
              {p.alamat_lengkap && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "9px", fontWeight: "600", textTransform: "uppercase" }}>Alamat:</span>
                  <span style={{ color: "var(--text-main)", lineHeight: "1.3" }}>{p.alamat_lengkap}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Area dicakup:
                </span>
                <strong style={{ color: "#10b981" }}>
                  {kontribusi.toFixed(2)} km²
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Tambahan coverage:
                </span>
                <strong style={{ color: "#10b981" }}>
                  +{persenKontribusi.toFixed(1)}%
                </strong>
              </div>
              {blankTeratasi > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    Blank spot teratasi:
                  </span>
                  <strong style={{ color: "#f59e0b" }}>
                    {blankTeratasi.toFixed(2)} km²
                  </strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Radius analisis:
                </span>
                <span>{(radius / 1000).toFixed(1)} km</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Jarak ke pos terdekat:
                </span>
                <strong style={{ color: "#f59e0b" }}>
                  {jarakPosTerdekat.toFixed(2)} km
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Jarak ke permukiman:
                </span>
                <strong style={{ color: "#10b981" }}>
                  {jarakPermukiman.toFixed(2)} km
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Jarak ke jalan:
                </span>
                <span>{jarakJalan.toFixed(2)} km</span>
              </div>
              <button
                type="button"
                className={`popup-route-button ${
                  hasActiveRoute ? "popup-route-button--cancel" : ""
                }`}
                onClick={() =>
                  hasActiveRoute
                    ? onRouteCancel?.()
                    : onRouteRequest?.(feature)
                }
                disabled={routing}
              >
                {hasActiveRoute ? (
                  <IconClose size={14} />
                ) : (
                  <IconNavigation size={14} />
                )}
                {routing && isSelected
                  ? "Mencari rute..."
                  : hasActiveRoute
                    ? "Batalkan Rute"
                    : "Lihat Rute dari Lokasi Saya"}
              </button>
              <button
                type="button"
                className={`popup-route-button ${
                  isRouteOrigin ? "popup-route-button--selected" : ""
                }`}
                onClick={() => onSetRouteOrigin?.(feature, "rekomendasi")}
                disabled={routing}
              >
                <IconPin size={14} />
                {isRouteOrigin ? "Batalkan Titik Awal" : "Jadikan Titik Awal"}
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default RekomendasiMarkers;
