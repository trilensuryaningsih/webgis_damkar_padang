import { useState, useEffect, useRef } from 'react';
import { IconAntenna } from '../Icons';

const RadiusControl = ({ radius, onRadiusChange }) => {
  // Nilai lokal untuk slider agar geseran terasa real-time,
  // sementara request ke backend hanya ditembak setelah berhenti menggeser.
  const [localRadius, setLocalRadius] = useState(radius);
  const timerRef = useRef(null);

  // Sinkron bila radius diubah dari luar
  useEffect(() => {
    setLocalRadius(radius);
  }, [radius]);

  // Bersihkan timer saat unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const commit = (val) => {
    clearTimeout(timerRef.current);
    if (val !== radius) onRadiusChange(val);
  };

  const handleChange = (val) => {
    setLocalRadius(val);
    clearTimeout(timerRef.current);
    // Debounce: tembak ke backend 400ms setelah geseran terakhir
    timerRef.current = setTimeout(() => commit(val), 400);
  };

  return (
    <div className="sidebar-section">
      {/* Section Header */}
      <div className="sidebar-section-header sidebar-section-header--static">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="section-icon section-icon--blue">
            <IconAntenna size={16} />
          </span>
          <span className="sidebar-title-text">Radius Layanan</span>
        </div>
        <span className="radius-pill">{(localRadius / 1000).toFixed(1)} km</span>
      </div>

      <div className="radius-slider-wrapper">
        <input
          type="range"
          className="slider-input"
          min="500"
          max="10000"
          step="500"
          value={localRadius}
          onChange={(e) => handleChange(Number(e.target.value))}
          // Saat lepas klik/keyboard: langsung commit tanpa menunggu debounce
          onMouseUp={(e) => commit(Number(e.target.value))}
          onTouchEnd={(e) => commit(Number(e.target.value))}
          onKeyUp={(e) => commit(Number(e.target.value))}
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
