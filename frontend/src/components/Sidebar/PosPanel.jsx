import { useCallback, useEffect, useRef, useState } from "react";
import { getDamkar } from "../../services/api";
import {
  IconChevronDown,
  IconExternalLink,
  IconFireStation,
} from "../Icons";

const PosPanel = ({
  refresh,
  radius = 3000,
  selectedDamkarId,
  onDamkarSelect,
}) => {
  const [data, setData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    let cancelled = false;

    const loadDamkar = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      try {
        const res = await getDamkar(radius);
        if (cancelled) return;
        setData(res.data);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching pos damkar:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDamkar();
    return () => {
      cancelled = true;
    };
  }, [refresh, radius]);

  useEffect(() => {
    if (
      selectedDamkarId &&
      itemRefs.current[selectedDamkarId] &&
      listRef.current
    ) {
      setIsCollapsed(false);
      setExpandedId(selectedDamkarId);
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
      const id = feature.properties.id;
      setExpandedId((current) => (current === id ? null : id));
      onDamkarSelect?.(feature);
    },
    [onDamkarSelect]
  );

  const features = data?.features || [];

  return (
    <div className="sidebar-section">
      <button
        className="sidebar-section-header"
        onClick={() => setIsCollapsed((current) => !current)}
        aria-expanded={!isCollapsed}
      >
        <div className="sidebar-section-title-group">
          <span className="section-icon section-icon--red">
            <IconFireStation size={17} />
          </span>
          <span className="sidebar-title-text">Pos Damkar Saat Ini</span>
          {!loading && (
            <span className="section-badge section-badge--red">
              {features.length}
            </span>
          )}
        </div>
        <IconChevronDown
          size={14}
          className={`collapse-chevron ${isCollapsed ? "is-collapsed" : ""}`}
        />
      </button>

      <div className={`collapse-body ${isCollapsed ? "collapsed" : "expanded"}`}>
        {loading ? (
          <div className="sidebar-skeleton-list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton-card" />
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
                persen_coverage,
              } = feature.properties;
              const isActive = selectedDamkarId === id;
              const isExpanded = expandedId === id;

              return (
                <div
                  key={id}
                  ref={(element) => {
                    if (element) itemRefs.current[id] = element;
                  }}
                  className={`pos-card ${isActive ? "pos-card--active" : ""} ${
                    isExpanded ? "pos-card--expanded" : ""
                  }`}
                  onClick={() => handleItemClick(feature)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleItemClick(feature);
                    }
                  }}
                  aria-label={`Pos Damkar ${no_pos}: ${nama_lokasi}`}
                  aria-expanded={isExpanded}
                >
                  <span className="pos-card-logo" aria-hidden="true">
                    <IconFireStation size={19} />
                  </span>

                  <div className="pos-card-content">
                    <div className="pos-card-header">
                      <h4 className="pos-card-title">
                        {nama_lokasi} (Pos {no_pos})
                      </h4>
                      <div className="pos-card-actions">
                        <span className="pos-status-badge">Aktif</span>
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
                        {alamat_lengkap && (
                          <p className="pos-card-address">{alamat_lengkap}</p>
                        )}

                        <div className="card-location-tags">
                          <span>
                            <strong>Kel:</strong> {kelurahan || "-"}
                          </span>
                          <span>
                            <strong>Kec:</strong> {kecamatan || "-"}
                          </span>
                        </div>

                        <div className="pos-card-meta">
                          <span className="pos-meta-item">
                            <span className="pos-meta-label">Radius</span>
                            <span className="pos-meta-value pos-meta-value--blue">
                              {(radius / 1000).toFixed(1)} km
                            </span>
                          </span>
                          <span className="pos-meta-item">
                            <span className="pos-meta-label">Cakupan</span>
                            <span className="pos-meta-value">
                              {area_km2
                                ? `${area_km2.toFixed(2)} km2 (${persen_coverage.toFixed(2)}%)`
                                : "-"}
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
                          onClick={(event) => event.stopPropagation()}
                        >
                          <IconExternalLink size={12} />
                          Lihat di Google Maps
                        </a>
                      </div>
                    )}
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
