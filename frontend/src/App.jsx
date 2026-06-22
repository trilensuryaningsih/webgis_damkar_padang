import { useState, useEffect } from 'react';
import MapPage from './pages/MapPage';
import AdminPage from './pages/AdminPage';
import { IconFire, IconMap, IconDatabase, IconChevronDown, IconSun, IconMoon } from './components/Icons';

function App() {
  const [page, setPage] = useState('map'); // 'map' or 'admin'
  const [refresh, setRefresh] = useState(0);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const triggerRefresh = () => {
    setRefresh(r => r + 1);
  };

  return (
    <div style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav className="app-navbar">
        <div className="brand">
          <div className="brand-icon-box">
            <IconFire size={18} color="white" />
          </div>
          <div className="brand-info">
            <span className="brand-title">WebGIS Damkar</span>
            <span className="brand-subtitle-nav brand-title-extra">Kota Padang</span>
          </div>
        </div>
        
        <div className="nav-links">
          <button
            onClick={() => setPage('map')}
            className={`nav-btn ${page === 'map' ? 'active' : ''}`}
          >
            <IconMap size={15} />
            <span className="nav-text-desktop">Peta Utama</span>
            <span className="nav-text-mobile">Peta</span>
          </button>
          <button
            onClick={() => setPage('admin')}
            className={`nav-btn ${page === 'admin' ? 'active' : ''}`}
          >
            <IconDatabase size={15} />
            <span className="nav-text-desktop">Manajemen Data</span>
            <span className="nav-text-mobile">Data</span>
          </button>
        </div>

        {/* Right side items */}
        <div className="nav-right">
          <button 
            className="nav-icon-btn" 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <div className="nav-user-profile">
            <div className="user-avatar">A</div>
            <span className="user-name nav-text-desktop">Admin</span>
            <IconChevronDown size={10} style={{ marginLeft: 2 }} />
          </div>
        </div>
      </nav>

      {/* Main Page Area */}
      <div className="app-container">
        {page === 'map' && (
          <MapPage refresh={refresh} onRefresh={triggerRefresh} theme={theme} />
        )}
        {page === 'admin' && (
          <AdminPage refresh={refresh} onRefresh={triggerRefresh} />
        )}
      </div>
    </div>
  );
}

export default App;


