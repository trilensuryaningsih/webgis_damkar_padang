import { IconMap, IconFire, IconCheck, IconBlankSpot, IconPin, IconRoad, IconAntenna } from '../Icons';

const LayerControl = ({ layers, onToggle }) => {
  const layerConfig = [
    { key: 'blankspot',   label: 'Area Blank Spot',            color: 'var(--primary)',    Icon: IconBlankSpot },
    { key: 'rekomendasi', label: 'Rekomendasi Lokasi Baru',    color: 'var(--accent)',     Icon: IconPin },
    { key: 'jalan',       label: 'Jaringan Jalan Raya',        color: 'var(--text-muted)', Icon: IconRoad },
  ];

  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <div className="sidebar-section-header sidebar-section-header--static">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="section-icon section-icon--gray">⚙️</span>
          <span className="sidebar-title-text">Filter Layer</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {layerConfig.map(({ key, label, color, Icon }) => (
          <div
            key={key}
            className="control-row"
            onClick={() => onToggle(key)}
          >
            <div className={`custom-cb cb-${key} ${layers[key] ? 'checked' : ''}`} />
            <label
              className="control-label"
              style={{ color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Icon size={13} color={color} />
              <span>{label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerControl;
