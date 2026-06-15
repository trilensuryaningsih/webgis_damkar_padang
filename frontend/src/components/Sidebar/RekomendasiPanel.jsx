import { useEffect, useState, useRef, useCallback } from "react";
import { getRekomendasi } from "../../services/api";

const RekomendasiPanel = ({
  refresh,
  radius = 3000,
  selectedRekomendasiId,
  onRekomendasiSelect,
}) => {
  const [data, setData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    setLoading(true);
    setData(null);
    getRekomendasi(radius)
      .then((res) => {
        const features = [...(res.data.features || [])].sort(
          (a, b) =>
            (a.properties.pos_ke || a.properties.id) -
            (b.properties.pos_ke || b.properties.id)
        );
        setData({ ...res.data, features });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setLoading(false);
      });
  }, [refresh, radius]);

  // Auto-scroll to active item when selectedRekomendasiId changes (map → sidebar)
  useEffect(() => {
    if (selectedRekomendasiId && itemRefs.current[selectedRekomendasiId] && listRef.current) {
      setIsCollapsed(false);
      setTimeout(() => {
        itemRefs.current[selectedRekomendasiId]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [selectedRekomendasiId]);

  const handleItemClick = useCallback(
    (feature) => {
      if (onRekomendasiSelect) onRekomendasiSelect(feature);
    },
    [onRekomendasiSelect]
  );

  const features = data?.features || [];
  const summary = data?.summary;

  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <button
        className="sidebar-section-header"
        onClick={() => setIsCollapsed((c) => !c)}
        aria-expanded={!isCollapsed}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span className="section-icon section-icon--blue">📍</span>
          <span className="sidebar-title-text">Rekomendasi Pos Baru</span>
          {!loading && summary && (
            <span className="section-badge section-badge--blue">
              {summary.total_pos_dibutuhkan || 0}
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

      {/* Collapsible Content */}
      <div className={`collapse-body ${isCollapsed ? "collapsed" : "expanded"}`}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : features.length === 0 ? (
          <div className="empty-state">
            Tidak ada rekomendasi pos baru (Wilayah sudah tercover sempurna).
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Summary Box */}
            {summary && (
              <div className="rekomendasi-summary-box">
                <div className="summary-row">
                  <span className="summary-label">Pos baru dibutuhkan:</span>
                  <strong className="summary-value-highlight">
                    {summary.total_pos_dibutuhkan || 0}
                  </strong>
                </div>

                <div className="summary-progress-group">
                  <div className="summary-progress-label">
                    <span>Coverage saat ini:</span>
                    <span>{Number(summary.persen_sebelum).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar-outer">
                    <div
                      className="progress-bar-inner"
                      style={{
                        width: `${Math.min(100, Number(summary.persen_sebelum) || 0)}%`,
                        background: "var(--text-muted)",
                      }}
                    />
                  </div>
                </div>

                <div className="summary-progress-group">
                  <div className="summary-progress-label">
                    <span>Coverage setelah rekomendasi:</span>
                    <span style={{ color: "var(--success)", fontWeight: 700 }}>
                      {Number(summary.persen_sesudah).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar-outer">
                    <div
                      className="progress-bar-inner"
                      style={{
                        width: `${Math.min(100, Number(summary.persen_sesudah) || 0)}%`,
                        background: "linear-gradient(90deg, var(--success), #34d399)",
                      }}
                    />
                  </div>
                </div>

                {summary.fully_covered && (
                  <div className="summary-alert-success">
                    ✓ Seluruh wilayah dapat tercover sempurna
                  </div>
                )}
              </div>
            )}

            {/* Recommendations List */}
            <div className="rekomendasi-list-scroll" ref={listRef}>
              {features.map((feature, index) => {
                const p = feature.properties;
                const posKe = p.pos_ke || index + 1;
                const isActive = selectedRekomendasiId === p.id;
                const skor = Math.min(
                  100,
                  Math.round(Number(p.skor_prioritas || 0) * 100)
                );
                const kontribusi = Number(p.kontribusi_km2 ?? p.luas_km2) || 0;
                const persenKontribusi = Number(p.persen_kontribusi) || 0;
                const blankSebelum = Number(p.luas_blankspot_sebelum_km2) || 0;
                const blankSesudah = Number(p.luas_blankspot_sesudah_km2) || 0;
                const blankTeratasi = parseFloat((blankSebelum - blankSesudah).toFixed(2));
                const lat = Number(p.lat);
                const lng = Number(p.lng);

                return (
                  <div
                    key={p.id}
                    ref={(el) => {
                      if (el) itemRefs.current[p.id] = el;
                    }}
                    className={`rekomendasi-card-v2 ${
                      isActive ? "rekomendasi-card-v2--active" : ""
                    }`}
                    onClick={() => handleItemClick(feature)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleItemClick(feature)}
                    style={{ padding: "8px 10px", gap: "8px" }}
                  >
                    {/* Small Location Marker Icon instead of big number box */}
                    <span style={{ fontSize: "14px", marginTop: "2px", flexShrink: 0 }}>📍</span>

                    {/* Content */}
                    <div className="rekomendasi-content" style={{ gap: "2px" }}>
                      <div className="rekomendasi-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h4 className="rekomendasi-card-title" style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-white)" }}>
                          {p.nama}
                        </h4>
                        {isActive && (
                          <span className="rekomendasi-active-dot" style={{ fontSize: "9px", color: "var(--success)" }}>
                            ● Terpilih
                          </span>
                        )}
                      </div>

                      {/* Address / Reverse Geocoded */}
                      {p.alamat_lengkap && (
                        <p className="rekomendasi-card-address" style={{ fontSize: "10.5px", color: "var(--text-main)", margin: "1px 0" }}>
                          {p.alamat_lengkap}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "var(--text-muted)", flexWrap: "wrap", margin: "1px 0" }}>
                        <span><strong>Kel:</strong> {p.kelurahan || "—"}</span>
                        <span><strong>Kec:</strong> {p.kecamatan || "—"}</span>
                      </div>

                      {/* Coverage Stats Grid */}
                      <div className="rekomendasi-card-meta" style={{ display: "flex", gap: "10px", marginTop: "2px", fontSize: "10px" }}>
                        <span className="pos-meta-item">
                          <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>+ Coverage</span>
                          <span style={{ fontWeight: "600", color: "var(--success)" }}>
                            +{persenKontribusi.toFixed(1)}%
                          </span>
                        </span>
                        <span className="pos-meta-item">
                          <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Luas Tambahan</span>
                          <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                            {kontribusi.toFixed(2)} km²
                          </span>
                        </span>
                        {blankTeratasi > 0 && (
                          <span className="pos-meta-item">
                            <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Blankspot Teratasi</span>
                            <span style={{ fontWeight: "600", color: "var(--warning)" }}>
                              {blankTeratasi.toFixed(2)} km²
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="rekomendasi-card-meta" style={{ display: "flex", gap: "10px", marginTop: "1px", fontSize: "10px" }}>
                        <span className="pos-meta-item">
                          <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Skor</span>
                          <span style={{ fontWeight: "700", color: isActive ? "var(--success)" : "var(--accent)" }}>
                            {skor}%
                          </span>
                        </span>
                        <span className="pos-meta-item">
                          <span className="pos-meta-label" style={{ fontSize: "8px", textTransform: "uppercase", color: "var(--text-muted)" }}>Koordinat</span>
                          <span style={{ fontFamily: "monospace", fontSize: "9px" }}>
                            {lat.toFixed(5)}, {lng.toFixed(5)}
                          </span>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                        <button
                          className="pos-maps-link"
                          style={{ fontSize: "9.5px", cursor: "pointer", border: "1px solid rgba(59,130,246,0.15)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(feature);
                          }}
                        >
                          🔍 Lihat Lokasi
                        </button>
                        <a
                          href={`https://www.google.com/maps?q=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="pos-maps-link"
                          style={{ fontSize: "9.5px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🗺 Buka di Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RekomendasiPanel;
