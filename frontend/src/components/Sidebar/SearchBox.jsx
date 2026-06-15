import { useState, useEffect } from 'react';
import { getDamkarList } from '../../services/api';
import { IconSearch, IconClose, IconFire } from '../Icons';

const SearchBox = ({ onSelectPos, refresh }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      getDamkarList(query)
        .then(res => setResults(res.data))
        .catch(err => console.error('Error searching stations:', err));
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [query, refresh]);

  const handleSelect = (pos) => {
    onSelectPos(pos);
    setQuery(pos.nama_lokasi);
    setShowDropdown(false);
  };

  return (
    <div className="sidebar-section" style={{ position: 'relative' }}>
      <div className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <IconSearch size={14} />
        <span>Cari Pos Damkar</span>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Ketik nama atau nomor pos..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="form-input"
          style={{ paddingLeft: '32px' }}
        />
        <span style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <IconSearch size={14} />
        </span>
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              setResults([]);
              onSelectPos(null);
            }}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconClose size={12} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((pos) => (
            <div
              key={pos.id}
              onClick={() => handleSelect(pos)}
              className="search-dropdown-item"
            >
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-white)' }}>
                <IconFire size={13} color="var(--primary)" />
                <span>Pos {pos.no_pos}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '18px' }}>{pos.nama_lokasi}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
