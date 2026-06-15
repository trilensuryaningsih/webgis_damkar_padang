import React from 'react';
import StatsPanel from './StatsPanel';
import LayerControl from './LayerControl';
import RekomendasiPanel from './RekomendasiPanel';
import SearchBox from './SearchBox';
import { IconFire, IconClose } from '../Icons';

const Sidebar = ({ layers, onToggle, radius, onRadiusChange, onSelectPos, refresh, isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header Info */}
        <div className="sidebar-header-card">
          {/* Close button on mobile */}
          <button 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Tutup Sidebar"
          >
            <IconClose size={18} color="white" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon-box sidebar-logo-box">
              <IconFire size={20} color="white" />
            </div>
            <div>
              <h2 className="sidebar-logo-title">WebGIS Damkar</h2>
              <p className="sidebar-logo-subtitle">ANALISIS BLANK SPOT · KOTA PADANG</p>
            </div>
          </div>
        </div>

        <SearchBox onSelectPos={onSelectPos} refresh={refresh} />
        <StatsPanel refresh={refresh} />
        <LayerControl
          layers={layers}
          onToggle={onToggle}
          radius={radius}
          onRadiusChange={onRadiusChange}
        />
        <RekomendasiPanel refresh={refresh} />
      </div>
    </>
  );
};

export default Sidebar;
