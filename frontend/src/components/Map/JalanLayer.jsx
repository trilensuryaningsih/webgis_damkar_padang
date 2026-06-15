import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getJalan } from '../../services/api';

const JalanLayer = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getJalan()
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching roads:', err));
  }, []);

  if (!data) return null;

  return (
    <GeoJSON
      key={JSON.stringify(data.features ? data.features.length : 'jalan')}
      data={data}
      style={{
        color: '#64748b',
        weight: 1.5,
        opacity: 0.6
      }}
    />
  );
};

export default JalanLayer;
