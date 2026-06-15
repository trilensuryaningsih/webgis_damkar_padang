import { useState, useEffect, useCallback } from "react";
import PadangMap from "../components/Map/MapContainer";
import Sidebar from "../components/Sidebar/Sidebar";
import { IconMap } from "../components/Icons";
import { getStats } from "../services/api";

const MapPage = ({ refresh, onRefresh, theme }) => {
  const [layers, setLayers] = useState({
    damkar: true,
    coverage: true,
    blankspot: true,
    rekomendasi: true,
    jalan: false,
  });
  const [radius, setRadius] = useState(3000);
  const [selectedPos, setSelectedPos] = useState(null); // legacy SearchBox compatibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  // Two-way interaction state
  const [selectedDamkarId, setSelectedDamkarId] = useState(null);
  const [selectedDamkarCoords, setSelectedDamkarCoords] = useState(null);
  const [selectedRekomendasiId, setSelectedRekomendasiId] = useState(null);
  const [selectedRekomendasiCoords, setSelectedRekomendasiCoords] = useState(null);

  useEffect(() => {
    getStats(radius)
      .then((res) => setLiveStats(res.data))
      .catch(() => setLiveStats(null));
  }, [refresh, radius]);

  const toggleLayer = (key) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Legacy: SearchBox selects a pos by coordinates
  const handleSelectPos = (pos) => {
    setSelectedPos(pos);
    if (pos && !layers.damkar) setLayers((prev) => ({ ...prev, damkar: true }));
  };

  // Sidebar → Map: User clicks a Damkar item in the list
  const handleDamkarSelect = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedDamkarId(id);
    setSelectedDamkarCoords({ lat, lng });
    setSelectedRekomendasiId(null); // deselect rekomendasi
    if (!layers.damkar) setLayers((prev) => ({ ...prev, damkar: true }));
  }, [layers.damkar]);

  // Map → Sidebar: User clicks a Damkar marker on the map
  const handleDamkarMarkerClick = useCallback((feature) => {
    const id = feature.properties.id;
    setSelectedDamkarId(id);
    setSelectedRekomendasiId(null);
  }, []);

  // Sidebar → Map: User clicks a Rekomendasi item in the list
  const handleRekomendasiSelect = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedRekomendasiId(id);
    setSelectedRekomendasiCoords({ lat, lng });
    setSelectedDamkarId(null); // deselect damkar
    if (!layers.rekomendasi) setLayers((prev) => ({ ...prev, rekomendasi: true }));
  }, [layers.rekomendasi]);

  // Map → Sidebar: User clicks a Rekomendasi marker on the map
  const handleRekomendasiMarkerClick = useCallback((feature) => {
    const id = feature.properties.id;
    setSelectedRekomendasiId(id);
    setSelectedDamkarId(null);
  }, []);

  return (
    <div className="map-page-container">
      <Sidebar
        layers={layers}
        onToggle={toggleLayer}
        radius={radius}
        onRadiusChange={setRadius}
        onSelectPos={handleSelectPos}
        refresh={refresh}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        // Two-way props
        selectedDamkarId={selectedDamkarId}
        onDamkarSelect={handleDamkarSelect}
        selectedRekomendasiId={selectedRekomendasiId}
        onRekomendasiSelect={handleRekomendasiSelect}
      />
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{ flex: 1, position: "relative", height: "calc(100% - 32px)" }}
        >
          <PadangMap
            layers={layers}
            radius={radius}
            selectedPos={selectedPos}
            refresh={refresh}
            theme={theme}
            // Two-way props
            selectedDamkarId={selectedDamkarId}
            selectedDamkarCoords={selectedDamkarCoords}
            onDamkarMarkerClick={handleDamkarMarkerClick}
            selectedRekomendasiId={selectedRekomendasiId}
            selectedRekomendasiCoords={selectedRekomendasiCoords}
            onRekomendasiMarkerClick={handleRekomendasiMarkerClick}
          />
          {!isSidebarOpen && (
            <button
              className="sidebar-toggle-fab"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka Panel Kontrol"
            >
              <IconMap size={18} />
              <span>Filter &amp; Info</span>
            </button>
          )}
        </div>

        <div className="map-status-bar">
          <div className="status-item">
            <span className="status-indicator"></span>
            <span>Sistem Aktif</span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>
              {liveStats ? `${liveStats.jumlah_pos} Pos Damkar` : "— Pos"}
            </span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>Radius: {(radius / 1000).toFixed(1)} km</span>
          </div>
          {liveStats && (
            <>
              <div className="status-separator"></div>
              <div className="status-item">
                <span style={{ color: "var(--success)" }}>
                  Terlayani:{" "}
                  {(
                    Number(liveStats.persen_terlayani) ||
                    100 - Number(liveStats.persen_blankspot)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="status-separator"></div>
              <div className="status-item">
                <span style={{ color: "var(--primary)" }}>
                  Blank Spot: {Number(liveStats.persen_blankspot).toFixed(1)}%
                </span>
              </div>
            </>
          )}
          <div
            className="nav-text-desktop"
            style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.5 }}
          >
            <span>© CARTO · OpenStreetMap contributors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
