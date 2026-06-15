import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getBlankspot } from '../../services/api';

const BlankSpotLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getBlankspot(radius)
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching blankspots:', err));
  }, [radius]);

  if (!data) return null;

  return (
    <GeoJSON
      key={`blankspot-${radius}-${data.geometry ? 'loaded' : 'empty'}`}
      data={data}
      style={{
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        weight: 1
      }}
    />
  );
};

export default BlankSpotLayer;
