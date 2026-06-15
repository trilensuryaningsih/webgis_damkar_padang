import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getRekomendasi } from '../../services/api';
import { IconPin } from '../Icons';

// Custom glowing green pin for recommended stations
const createGlowingGreenPin = () => {
  const size = 22;
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div class="pin-wrapper" style="width: ${size}px; height: ${size}px;">
        <div class="pin-body" style="background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.75); width: ${size}px; height: ${size}px;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const rekomendasiIcon = createGlowingGreenPin();

const RekomendasiMarkers = ({ refresh }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRekomendasi()
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching recommendations:', err));
  }, [refresh]);

  if (!data || !data.features) return null;

  return data.features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const { id, nama, luas_km2, skor_prioritas } = feature.properties;

    return (
      <Marker key={id} position={[lat, lng]} icon={rekomendasiIcon}>
        <Popup>
          <div style={{ textAlign: 'left', minWidth: '150px' }}>
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-white)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconPin size={13} color="#10b981" /> Kec. {nama}
            </h4>
            <p style={{ margin: '4px 0 2px', fontSize: '11px' }}>
              Luas area terlayani: <strong>{luas_km2} km²</strong>
            </p>
            <p style={{ margin: '2px 0 4px', fontSize: '11px' }}>
              Skor prioritas: <strong style={{ color: '#10b981' }}>{(skor_prioritas * 100).toFixed(1)}%</strong>
            </p>
            <p style={{ margin: '2px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Koordinat: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
        </Popup>
      </Marker>
    );
  });
};

export default RekomendasiMarkers;
