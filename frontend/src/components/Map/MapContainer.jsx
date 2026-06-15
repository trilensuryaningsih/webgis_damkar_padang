import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DamkarMarkers from './DamkarMarkers';
import CoverageLayer from './CoverageLayer';
import BlankSpotLayer from './BlankSpotLayer';
import RekomendasiMarkers from './RekomendasiMarkers';
import JalanLayer from './JalanLayer';

// Component to handle auto zoom and pan on searched pos damkar
const ChangeView = ({ selectedPos }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPos) {
      map.setView([selectedPos.lat, selectedPos.lng], 14, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedPos, map]);
  return null;
};

const PadangMap = ({ layers, radius, selectedPos, refresh, theme }) => {
  // Center coordinate Kota Padang
  const center = [-0.9492, 100.3543];

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={theme === 'light' ? 'light-map' : 'dark-map'}
          url={theme === 'light' 
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {layers.jalan && <JalanLayer />}
        {layers.coverage && <CoverageLayer radius={radius} />}
        {layers.blankspot && <BlankSpotLayer radius={radius} />}
        {layers.damkar && <DamkarMarkers selectedPos={selectedPos} refresh={refresh} />}
        {layers.rekomendasi && <RekomendasiMarkers refresh={refresh} />}
        
        {/* Dynamic Zooming on Search Selection */}
        <ChangeView selectedPos={selectedPos} />
      </MapContainer>
    </div>
  );
};

export default PadangMap;
