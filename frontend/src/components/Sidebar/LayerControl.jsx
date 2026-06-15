import { IconMap, IconFire, IconCheck, IconBlankSpot, IconPin, IconRoad, IconAntenna } from '../Icons';

const LayerControl = ({ layers, onToggle, radius, onRadiusChange }) => {
  const layerConfig = [
    { key: 'damkar',      label: 'Pos Damkar Eksisting',   color: 'var(--primary)',      Icon: IconFire },
    { key: 'coverage',    label: 'Area Terlayani (Jangkauan)', color: 'var(--success)',      Icon: IconCheck },
    { key: 'blankspot',   label: 'Area Blank Spot',        color: 'var(--primary)',      Icon: IconBlankSpot },
    { key: 'rekomendasi', label: 'Rekomendasi Lokasi Baru', color: 'var(--accent)',       Icon: IconPin },
    { key: 'jalan',       label: 'Jaringan Jalan Raya',   color: 'var(--text-muted)',   Icon: IconRoad },
  ];

  return (
    <div className="sidebar-section">
      <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <IconMap size={14} />
        <span>Layer Peta</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {layerConfig.map(({ key, label, color, Icon }) => (
          <div 
            key={key} 
            className="control-row"
            onClick={() => onToggle(key)}
          >
            <div className={`custom-cb cb-${key} ${layers[key] ? 'checked' : ''}`} />
            <label 
              className="control-label"
              htmlFor={`layer-cb-${key}`}
              style={{ color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={(e) => e.stopPropagation()} // let row click handle it
            >
              <Icon size={14} color={color} />
              <span>{label}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Slider for radius */}
      <div className="slider-container" style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px', background: 'transparent', border: 'none', padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconAntenna size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>Radius Layanan</span>
          </div>
          <span className="radius-pill">{(radius / 1000).toFixed(1)} km</span>
        </div>
        <input
          type="range"
          className="slider-input"
          min="500"
          max="10000"
          step="500"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>0.5 km</span>
          <span>10.0 km</span>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;
