import { useEffect, useState } from 'react';
import { getRekomendasi } from '../../services/api';
import { IconPin } from '../Icons';

const RekomendasiPanel = ({ refresh }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRekomendasi()
      .then(res => {
        // Sort by priority descending and take top 5
        const sorted = res.data.features
          .sort((a, b) => b.properties.skor_prioritas - a.properties.skor_prioritas)
          .slice(0, 5);
        setData({ ...res.data, features: sorted });
      })
      .catch(err => console.error('Error fetching recommendations:', err));
  }, [refresh]);

  if (!data || !data.features) {
    return (
      <div className="sidebar-section">
        <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconPin size={14} />
          <span>Rekomendasi Pos Baru</span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Memuat rekomendasi...</p>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <IconPin size={14} />
        <span>Rekomendasi Pos Baru</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
        {data.features.map((feature, index) => {
          const { id, nama, luas_km2, skor_prioritas } = feature.properties;
          const percentage = Math.round(skor_prioritas * 100);
          return (
            <div key={id} className="rekomendasi-card-v2">
              <div className="rekomendasi-badge">{index + 1}</div>
              <div className="rekomendasi-content">
                <h4 className="rekomendasi-card-title">{nama}</h4>
                <p className="rekomendasi-card-desc">Kec. {nama} · {luas_km2} km²</p>
                <div className="rekomendasi-progress-row">
                  <div className="rekomendasi-progress-outer">
                    <div className="rekomendasi-progress-inner" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="rekomendasi-progress-text">{percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RekomendasiPanel;
