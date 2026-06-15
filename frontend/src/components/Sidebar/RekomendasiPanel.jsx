import { useEffect, useState, useRef, useCallback } from "react";
import { getRekomendasi } from "../../services/api";
import {
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconPin,
} from "../Icons";

const RekomendasiPanel = ({
  refresh,
  radius = 3000,
  selectedRekomendasiId,
  onRekomendasiSelect,
}) => {
  const [data, setData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    const loadRecommendations = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setData(null);
      setError("");

      try {
        const res = await getRekomendasi(radius);
        if (cancelled) return;

        const features = [...(res.data.features || [])].sort(
          (a, b) =>
            (a.properties.pos_ke || a.properties.id) -
            (b.properties.pos_ke || b.properties.id)
        );
        setData({ ...res.data, features });
      } catch (err) {
        if (cancelled) return;

        console.error("Error fetching recommendations:", err);
        setError(
          "Rekomendasi gagal dimuat. Pastikan backend berjalan, lalu coba lagi."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [refresh, radius]);

  // Auto-scroll to active item when selectedRekomendasiId changes (map → sidebar)
  useEffect(() => {
    if (selectedRekomendasiId && itemRefs.current[selectedRekomendasiId] && listRef.current) {
      setIsCollapsed(false);
      setExpandedId(selectedRekomendasiId);
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
      const id = feature.properties.id;
      setExpandedId((current) => (current === id ? null : id));
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
          <span className="section-icon section-icon--blue">
            <IconPin size={16} />
          </span>
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
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : features.length === 0 && summary?.fully_covered ? (
          <div className="empty-state">
            Tidak ada rekomendasi pos baru (Wilayah sudah tercover sempurna).
          </div>
        ) : features.length === 0 ? (
          <div className="empty-state">
            Kandidat pos baru belum dapat dihitung untuk radius ini.
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

                <div className="priority-method-note">
                  Prioritas mempertimbangkan kedekatan permukiman, tambahan
                  cakupan, jarak dari pos lama, dan akses jalan.
                </div>

                {summary.fully_covered && (
                  <div className="summary-alert-success">
                    <IconCheck size={13} />
                    Seluruh wilayah dapat tercover sempurna
                  </div>
                )}
              </div>
            )}

            {/* Recommendations List */}
            <div className="rekomendasi-list-scroll" ref={listRef}>
              {features.map((feature) => {
                const p = feature.properties;
                const isActive = selectedRekomendasiId === p.id;
                const isExpanded = expandedId === p.id;
                const skor = Math.min(
                  100,
                  Math.round(Number(p.skor_prioritas || 0) * 100)
                );
                const kontribusi = Number(p.kontribusi_km2 ?? p.luas_km2) || 0;
                const persenKontribusi = Number(p.persen_kontribusi) || 0;
                const blankSebelum = Number(p.luas_blankspot_sebelum_km2) || 0;
                const blankSesudah = Number(p.luas_blankspot_sesudah_km2) || 0;
                const blankTeratasi = parseFloat((blankSebelum - blankSesudah).toFixed(2));
                const jarakPosTerdekat =
                  Number(p.jarak_pos_terdekat_km) || 0;
                const jarakPermukiman = Number(p.jarak_permukiman_km) || 0;
                const jarakJalan = Number(p.jarak_jalan_km) || 0;
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
                    } ${isExpanded ? "rekomendasi-card-v2--expanded" : ""}`}
                    onClick={() => handleItemClick(feature)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleItemClick(feature);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <span className="rekomendasi-card-icon">
                      <IconPin size={16} />
                    </span>

                    {/* Content */}
                    <div className="rekomendasi-content" style={{ gap: "2px" }}>
                      <div className="rekomendasi-card-header">
                        <h4 className="rekomendasi-card-title">
                          {p.nama}
                        </h4>
                        <div className="pos-card-actions">
                          {isActive && (
                            <span className="rekomendasi-active-dot">Terpilih</span>
                          )}
                          <IconChevronDown
                            size={14}
                            className={`card-detail-chevron ${
                              isExpanded ? "card-detail-chevron--open" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <span className="card-detail-hint">
                        {isExpanded ? "Tutup detail" : "Lihat detail"}
                      </span>

                      {isExpanded && (
                        <div className="card-expanded-detail">
                          {p.alamat_lengkap && (
                            <p className="rekomendasi-card-address">
                              {p.alamat_lengkap}
                            </p>
                          )}

                          <div className="card-location-tags">
                            <span><strong>Kel:</strong> {p.kelurahan || "-"}</span>
                            <span><strong>Kec:</strong> {p.kecamatan || "-"}</span>
                          </div>

                          <div className="rekomendasi-card-meta">
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">+ Coverage</span>
                              <span className="rekomendasi-value-success">
                                +{persenKontribusi.toFixed(1)}%
                              </span>
                            </span>
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">Luas Tambahan</span>
                              <span className="pos-meta-value">
                                {kontribusi.toFixed(2)} km2
                              </span>
                            </span>
                            {blankTeratasi > 0 && (
                              <span className="pos-meta-item">
                                <span className="pos-meta-label">Blankspot Teratasi</span>
                                <span className="rekomendasi-value-warning">
                                  {blankTeratasi.toFixed(2)} km2
                                </span>
                              </span>
                            )}
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">
                                Jarak Pos Terdekat
                              </span>
                              <span className="rekomendasi-value-warning">
                                {jarakPosTerdekat.toFixed(2)} km
                              </span>
                            </span>
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">
                                Jarak Permukiman
                              </span>
                              <span className="rekomendasi-value-success">
                                {jarakPermukiman.toFixed(2)} km
                              </span>
                            </span>
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">
                                Akses Jalan
                              </span>
                              <span className="pos-meta-value">
                                {jarakJalan.toFixed(2)} km
                              </span>
                            </span>
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">
                                Skor Prioritas
                              </span>
                              <span className="rekomendasi-value-score">
                                {skor}%
                              </span>
                            </span>
                            <span className="pos-meta-item">
                              <span className="pos-meta-label">Koordinat</span>
                              <span className="pos-meta-value pos-meta-value--mono">
                                {lat.toFixed(5)}, {lng.toFixed(5)}
                              </span>
                            </span>
                          </div>

                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="pos-maps-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconExternalLink size={12} />
                            Buka di Google Maps
                          </a>
                        </div>
                      )}
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
