import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getCoverage } from '../../services/api';

const CoverageLayer = ({ radius }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getCoverage(radius)
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching coverage:', err));
  }, [radius]);

  if (!data) return null;

  return (
    <GeoJSON
      key={`coverage-${radius}-${data.features ? data.features.length : 0}`}
      data={data}
      style={{
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.25,
        weight: 1.5
      }}
    />
  );
};

export default CoverageLayer;
