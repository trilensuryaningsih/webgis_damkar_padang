import { IconAntenna } from '../Icons';

const RadiusControl = ({ radius, onRadiusChange }) => {
  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <div className="sidebar-section-header sidebar-section-header--static">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="section-icon section-icon--blue">📡</span>
          <span className="sidebar-title-text">Radius Layanan</span>
        </div>
        <span className="radius-pill">{(radius / 1000).toFixed(1)} km</span>
      </div>

      <div className="radius-slider-wrapper">
        <input
          type="range"
          className="slider-input"
          min="500"
          max="10000"
          step="500"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          aria-label="Radius layanan pos damkar"
        />
        <div className="slider-labels">
          <span>0.5 km</span>
          <span>10.0 km</span>
        </div>
      </div>
    </div>
  );
};

export default RadiusControl;
