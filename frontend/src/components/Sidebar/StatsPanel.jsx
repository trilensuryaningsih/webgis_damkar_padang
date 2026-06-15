import { useEffect, useState } from "react";
import { getStats, getRekomendasi } from "../../services/api";
import { IconStats } from "../Icons";

const StatsPanel = ({ refresh, radius = 3000 }) => {
  const [stats, setStats] = useState(null);
  const [rekSummary, setRekSummary] = useState(null);

  useEffect(() => {
    getStats(radius)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error fetching statistics:", err));
  }, [refresh, radius]);

  useEffect(() => {
    getRekomendasi(radius)
      .then((res) => setRekSummary(res.data?.summary || null))
      .catch(() => setRekSummary(null));
  }, [refresh, radius]);

  const isLoading = !stats;

  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <div className="sidebar-section-header sidebar-section-header--static">
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span className="section-icon section-icon--amber">
            <IconStats size={16} />
          </span>
          <span className="sidebar-title-text">Ringkasan Analisis</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: "48px" }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="stats-grid">
            <div className="stat-card stat-card--red">
              <span className="stat-label">Pos Saat Ini</span>
              <div className="stat-val-group">
                <span className="stat-value">{Number(stats.jumlah_pos) || 0}</span>
                <span className="stat-unit">pos</span>
              </div>
            </div>
            <div className="stat-card stat-card--amber">
              <span className="stat-label">Pos Dibutuhkan</span>
              <div className="stat-val-group">
                <span className="stat-value" style={{ color: "var(--warning)" }}>
                  {Number(rekSummary?.total_pos_dibutuhkan) || "–"}
                </span>
                <span className="stat-unit">pos</span>
              </div>
            </div>
            <div className="stat-card stat-card--green">
              <span className="stat-label">Coverage Kini</span>
              <div className="stat-val-group">
                <span className="stat-value" style={{ color: "var(--success)" }}>
                  {(
                    Number(stats.persen_terlayani) ||
                    100 - Number(stats.persen_blankspot)
                  ).toFixed(0)}
                </span>
                <span className="stat-unit">%</span>
              </div>
            </div>
            <div className="stat-card stat-card--blue">
              <span className="stat-label">Coverage +Rek.</span>
              <div className="stat-val-group">
                <span className="stat-value" style={{ color: "var(--accent)" }}>
                  {rekSummary
                    ? Number(rekSummary.persen_sesudah).toFixed(0)
                    : "–"}
                </span>
                <span className="stat-unit">%</span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="analysis-progress-box">
            {/* Coverage bar */}
            <div className="progress-header">
              <span>Cakupan Layanan</span>
              <span style={{ color: "var(--success)", fontWeight: "700", fontSize: "12px" }}>
                {(
                  Number(stats.persen_terlayani) ||
                  100 - Number(stats.persen_blankspot)
                ).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-outer">
              <div
                className="progress-bar-inner"
                style={{
                  width: `${Math.min(
                    100,
                    Number(stats.persen_terlayani) ||
                      100 - Number(stats.persen_blankspot)
                  )}%`,
                  background:
                    "linear-gradient(90deg, var(--success) 0%, #34d399 100%)",
                }}
              />
            </div>

            {/* Blank spot bar */}
            <div className="progress-header" style={{ marginTop: "10px" }}>
              <span>Area Blank Spot</span>
              <span className="progress-value-percent">
                {Number(stats.persen_blankspot).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-outer">
              <div
                className="progress-bar-inner"
                style={{
                  width: `${Math.min(100, Number(stats.persen_blankspot))}%`,
                }}
              />
            </div>

            <div className="progress-footer" style={{ marginTop: "8px" }}>
              <span>
                Terlayani:{" "}
                {Number(stats.luas_terlayani_km2)?.toFixed(1) || "0"} km²
              </span>
              <span>
                Blank spot:{" "}
                {Number(stats.luas_blankspot_km2)?.toFixed(1) || "0"} km²
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPanel;
