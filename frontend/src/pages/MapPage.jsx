import { useState } from 'react';
import PadangMap from '../components/Map/MapContainer';
import Sidebar from '../components/Sidebar/Sidebar';
import { IconMap } from '../components/Icons';

const MapPage = ({ refresh, onRefresh, theme }) => {
  const [layers, setLayers] = useState({
    damkar: true,
    coverage: true,
    blankspot: true,
    rekomendasi: true,
    jalan: false
  });
  const [radius, setRadius] = useState(3000);
  const [selectedPos, setSelectedPos] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectPos = (pos) => {
    setSelectedPos(pos);
    if (pos && !layers.damkar) {
      // Auto enable damkar layer to see highlighted search marker
      setLayers(prev => ({ ...prev, damkar: true }));
    }
  };

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
      />
      <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 34px)' }}>
          <PadangMap
            layers={layers}
            radius={radius}
            selectedPos={selectedPos}
            refresh={refresh}
            theme={theme}
          />
          
          {/* Floating Toggle Button for Sidebar on Mobile */}
          {!isSidebarOpen && (
            <button
              className="sidebar-toggle-fab"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka Panel Kontrol"
            >
              <IconMap size={18} />
              <span>Filter & Info</span>
            </button>
          )}
        </div>
        
        {/* Bottom Status Bar */}
        <div className="map-status-bar">
          <div className="status-item">
            <span className="status-indicator"></span>
            <span>Sistem Aktif</span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>7 Pos Damkar Terdaftar</span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>Radius: {(radius / 1000).toFixed(1)} km</span>
          </div>
          <div className="nav-text-desktop" style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.8 }}>
            <span>&copy; CARTO &middot; OpenStreetMap contributors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
