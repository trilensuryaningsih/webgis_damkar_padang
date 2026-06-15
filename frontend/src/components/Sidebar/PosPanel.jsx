import { useEffect, useState, useRef, useCallback } from "react";
import { getDamkar } from "../../services/api";

const PosPanel = ({ refresh, radius = 3000, selectedDamkarId, onDamkarSelect }) => {
  const [data, setData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    setLoading(true);
    getDamkar(radius)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching pos damkar:", err);
        setLoading(false);
      });
  }, [refresh, radius]);

  // Auto-scroll to active item when selectedDamkarId changes (map → sidebar)
  useEffect(() => {
    if (selectedDamkarId && itemRefs.current[selectedDamkarId] && listRef.current) {
      // Expand if collapsed
      setIsCollapsed(false);
      // Scroll item into view
      setTimeout(() => {
        itemRefs.current[selectedDamkarId]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [selectedDamkarId]);

  const handleItemClick = useCallback(
    (feature) => {
      if (onDamkarSelect) onDamkarSelect(feature);
    },
    [onDamkarSelect]
  );

  const features = data?.features || [];

  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <button
        className="sidebar-section-header"
        onClick={() => setIsCollapsed((c) => !c)}
        aria-expanded={!isCollapsed}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span className="section-icon section-icon--red">🚒</span>
          <span className="sidebar-title-text">Pos Damkar Saat Ini</span>
          {!loading && (
            <span className="section-badge section-badge--red">
              {features.length}
            </span>
          )}
        </div>
        <span
          className="collapse-chevron"
          style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* Collapsible content */}
      <div className={`collapse-body ${isCollapsed ? "collapsed" : "expanded"}`}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : features.length === 0 ? (
          <div className="empty-state">Tidak ada data pos damkar.</div>
        ) : (
          <div className="pos-list-scroll" ref={listRef}>
            {features.map((feature) => {
              const {
                id,
                no_pos,
                nama_lokasi,
                lat,
                lng,
                alamat_lengkap,
                kelurahan,
                kecamatan,
                area_km2,
                persen_coverage
              } = feature.properties;
              const isActive = selectedDamkarId === id;

              return (
                <div
                  key={id}
                  ref={(el) => {
                    if (el) itemRefs.current[id] = el;
                  }}
                  className={`pos-card ${isActive ? "pos-card--active" : ""}`}
                  onClick={() => handleItemClick(feature)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleItemClick(feature)}
                  aria-label={`Pos Damkar ${no_pos}: ${nama_lokasi}`}
                  style={{ padding: "8px 10px", gap: "8px" }}
                >
                  {/* Small Firetruck Icon */}
                  <span style={{ fontSize: "14px", marginTop: "2px", flexShrink: 0 }}>🚒</span>

                  {/* Content */}
                  <div className="pos-card-content" style={{ gap: "2px" }}>
                    <div className="pos-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 className="pos-card-title" style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-white)" }}>
                        {nama_lokasi} (Pos {no_pos})
                      </h4>
                      <span className="pos-status-badge" style={{ fontSize: "9px", color: "var(--success)" }}>
                        ● Aktif
                      </span>
                    </div>

                    {/* Geocoded Address Details */}
                    {alamat_lengkap && (
                      <p className="pos-card-address" style={{ fontSize: "10.5px", color: "var(--text-main)", margin: "1px 0" }}>
                        {alamat_lengkap}
                      </p>
                    )}
                    
                    <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "var(--text-muted)", flexWrap: "wrap", margin: "1px 0" }}>
                      <span><strong>Kel:</strong> {kelurahan || "—"}</span>
                      <span><strong>Kec:</strong> {kecamatan || "—"}</span>
                    </div>

                    {/* Coordinates & Service Radius */}
                    <div className="pos-card-meta" style={{ display: "flex", gap: "10px", marginTop: "2px", fontSize: "10px" }}>
                      <span className="pos-meta-item">
                        <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Radius</span>
                        <span className="pos-meta-value pos-meta-value--blue" style={{ color: "var(--accent)", fontWeight: "600" }}>
                          {(radius / 1000).toFixed(1)} km
                        </span>
                      </span>
                      <span className="pos-meta-item">
                        <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Cakupan</span>
                        <span className="pos-meta-value" style={{ fontWeight: "600", color: "var(--text-main)" }}>
                          {area_km2 ? `${area_km2.toFixed(2)} km² (${persen_coverage.toFixed(2)}%)` : "—"}
                        </span>
                      </span>
                      <span className="pos-meta-item">
                        <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Koordinat</span>
                        <span className="pos-meta-value pos-meta-value--mono" style={{ fontFamily: "monospace", fontSize: "9px" }}>
                          {lat.toFixed(5)}, {lng.toFixed(5)}
                        </span>
                      </span>
                    </div>

                    {/* Google Maps link button format matching requirement */}
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="pos-maps-link"
                      style={{ fontSize: "9.5px", marginTop: "6px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🗺 Lihat di Google Maps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosPanel;
