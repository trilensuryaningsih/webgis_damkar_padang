import { useEffect, useState } from 'react';
import { getStats } from '../../services/api';
import { IconStats } from '../Icons';

const StatsPanel = ({ refresh }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error('Error fetching statistics:', err));
  }, [refresh]);

  if (!stats) {
    return (
      <div className="sidebar-section">
        <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconStats size={14} />
          <span>Statistik Wilayah</span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Memuat statistik...</p>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <IconStats size={14} />
        <span>Statistik Wilayah</span>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Luas Kota</span>
          <div className="stat-val-group">
            <span className="stat-value">{stats.luas_kota_km2}</span>
            <span className="stat-unit">km²</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Pos Aktif</span>
          <div className="stat-val-group">
            <span className="stat-value">{stats.jumlah_pos}</span>
            <span className="stat-unit">Pos</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Terlayani</span>
          <div className="stat-val-group">
            <span className="stat-value">{stats.luas_terlayani_km2}</span>
            <span className="stat-unit">km²</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-label">Blank Spot</span>
          <div className="stat-val-group">
            <span className="stat-value">{stats.luas_blankspot_km2}</span>
            <span className="stat-unit">km²</span>
          </div>
        </div>
      </div>

      <div className="blankspot-progress-container">
        <div className="progress-header">
          <span>Rasio Blank Spot</span>
          <span className="progress-value-percent">{stats.persen_blankspot}%</span>
        </div>
        <div className="progress-bar-outer">
          <div className="progress-bar-inner" style={{ width: `${stats.persen_blankspot}%` }}></div>
        </div>
        <div className="progress-footer">
          <span>Terlayani {(100 - stats.persen_blankspot).toFixed(1)}%</span>
          <span>Blank Spot {stats.persen_blankspot}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
