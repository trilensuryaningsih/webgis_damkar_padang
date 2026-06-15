import { useEffect, useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getDamkar } from '../../services/api';
import { IconFiretruck, IconExternalLink } from '../Icons';

// Custom glowing pin generator helper
const createGlowingPinIcon = (pinColor, glowColor, isSelected = false) => {
  const size = isSelected ? 30 : 22;
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div class="pin-wrapper" style="width: ${size}px; height: ${size}px;">
        <div class="pin-body" style="background: ${pinColor}; box-shadow: 0 0 10px ${glowColor}; width: ${size}px; height: ${size}px;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const damkarIcon = createGlowingPinIcon('#ef4444', 'rgba(239, 68, 68, 0.75)', false);
const selectedDamkarIcon = createGlowingPinIcon('#ef4444', 'rgba(239, 68, 68, 0.95)', true);

const MarkerItem = ({ feature, selectedPos }) => {
  const [lng, lat] = feature.geometry.coordinates;
  const { id, no_pos, nama_lokasi, google_maps_link } = feature.properties;
  const markerRef = useRef(null);
  const isSelected = selectedPos && selectedPos.id === id;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker 
      ref={markerRef} 
      position={[lat, lng]} 
      icon={isSelected ? selectedDamkarIcon : damkarIcon}
    >
      <Popup>
        <div style={{ textAlign: 'left', minWidth: '150px' }}>
          <h4 style={{ margin: '0 0 4px', color: 'var(--text-white)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconFiretruck size={14} color="#ef4444" /> Pos {no_pos}: {nama_lokasi}
          </h4>
          <p style={{ margin: '2px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Koordinat: {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
          {google_maps_link && (
            <a 
              href={google_maps_link} 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px',
                fontSize: '11px',
                color: '#3b82f6',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <IconExternalLink size={11} color="#3b82f6" /> Buka di Google Maps
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const DamkarMarkers = ({ selectedPos, refresh }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDamkar()
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching fire stations:', err));
  }, [refresh]);

  if (!data || !data.features) return null;

  return (
    <>
      {data.features.map(feature => (
        <MarkerItem 
          key={feature.properties.id} 
          feature={feature} 
          selectedPos={selectedPos} 
        />
      ))}
    </>
  );
};

export default DamkarMarkers;
