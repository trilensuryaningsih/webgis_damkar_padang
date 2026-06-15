import React from "react";
import StatsPanel from "./StatsPanel";
import LayerControl from "./LayerControl";
import RadiusControl from "./RadiusControl";
import PosPanel from "./PosPanel";
import RekomendasiPanel from "./RekomendasiPanel";
import SearchBox from "./SearchBox";
import { IconFire, IconClose } from "../Icons";

const Sidebar = ({
  layers,
  onToggle,
  radius,
  onRadiusChange,
  onSelectPos,
  refresh,
  isOpen,
  onClose,
  selectedDamkarId,
  onDamkarSelect,
  selectedRekomendasiId,
  onRekomendasiSelect,
}) => {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand / Logo Header */}
        <div className="sidebar-header-card">
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Tutup Sidebar"
          >
            <IconClose size={18} color="white" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="brand-icon-box sidebar-logo-box">
              <IconFire size={20} color="white" />
            </div>
            <div>
              <h2 className="sidebar-logo-title">WebGIS Damkar</h2>
              <p className="sidebar-logo-subtitle">
                ANALISIS BLANK SPOT · KOTA PADANG
              </p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <SearchBox onSelectPos={onSelectPos} refresh={refresh} />

        <hr className="sidebar-divider" />

        {/* 1. Layer Control (Peta & Legenda) */}
        <LayerControl layers={layers} onToggle={onToggle} />

        <hr className="sidebar-divider" />

        {/* 2. Parameter Analisis (Radius slider) */}
        <RadiusControl radius={radius} onRadiusChange={onRadiusChange} />

        <hr className="sidebar-divider" />

        {/* 3. Ringkasan Analisis (Statistik) */}
        <StatsPanel refresh={refresh} radius={radius} />

        <hr className="sidebar-divider" />

        {/* 4. Pos Damkar Saat Ini */}
        <PosPanel
          refresh={refresh}
          radius={radius}
          selectedDamkarId={selectedDamkarId}
          onDamkarSelect={onDamkarSelect}
        />

        <hr className="sidebar-divider" />

        {/* 5. Rekomendasi Pos Baru */}
        <RekomendasiPanel
          refresh={refresh}
          radius={radius}
          selectedRekomendasiId={selectedRekomendasiId}
          onRekomendasiSelect={onRekomendasiSelect}
        />
      </div>
    </>
  );
};

export default Sidebar;
