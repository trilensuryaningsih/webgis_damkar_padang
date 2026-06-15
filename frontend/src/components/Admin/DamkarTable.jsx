import { useEffect, useState } from 'react';
import { getDamkarList, deleteDamkar } from '../../services/api';
import { IconSearch, IconFire, IconEdit, IconTrash } from '../Icons';

const DamkarTable = ({ onEdit, onRefresh, refresh }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDamkarList(search)
      .then(res => setData(res.data))
      .catch(err => console.error('Error fetching fire stations:', err));
  }, [search, refresh]);

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus pos "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteDamkar(id);
      alert(`Pos "${nama}" berhasil dihapus.`);
      onRefresh();
    } catch (err) {
      alert('Gagal menghapus pos damkar: ' + err.message);
    }
  };

  return (
    <div className="table-container">
      {/* Search Filter Header */}
      <div className="table-search">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Cari berdasarkan nama lokasi atau nomor pos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)'
          }}>
            <IconSearch size={14} />
          </span>
        </div>
      </div>

      {/* Table Element */}
      <table className="table-element">
        <thead>
          <tr>
            <th style={{ width: '120px' }}>No. Pos</th>
            <th>Nama Lokasi</th>
            <th style={{ width: '150px' }}>Latitude</th>
            <th style={{ width: '150px' }}>Longitude</th>
            <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                {search ? 'Pos damkar tidak ditemukan.' : 'Belum ada data pos damkar.'}
              </td>
            </tr>
          ) : (
            data.map((pos) => (
              <tr key={pos.id}>
                <td style={{ fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconFire size={14} color="var(--primary)" />
                    <span>Pos {pos.no_pos}</span>
                  </div>
                </td>
                <td>{pos.nama_lokasi}</td>
                <td style={{ fontFamily: 'monospace' }}>{parseFloat(pos.lat).toFixed(6)}</td>
                <td style={{ fontFamily: 'monospace' }}>{parseFloat(pos.lng).toFixed(6)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => onEdit(pos)}
                      className="action-btn"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onMouseEnter={(e) => { e.target.style.background = 'var(--accent)'; e.target.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'var(--accent-light)'; e.target.style.color = 'var(--accent)'; }}
                    >
                      <IconEdit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pos.id, pos.nama_lokasi)}
                      className="action-btn"
                      style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onMouseEnter={(e) => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'var(--primary-light)'; e.target.style.color = 'var(--primary)'; }}
                    >
                      <IconTrash size={12} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DamkarTable;
