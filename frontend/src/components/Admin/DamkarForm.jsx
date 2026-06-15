import { useState, useEffect } from 'react';
import { createDamkar, updateDamkar } from '../../services/api';
import { IconEdit, IconPlus } from '../Icons';

const DamkarForm = ({ editData, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    nama_lokasi: '', no_pos: '', lat: '', lng: '', google_maps_li: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        nama_lokasi: editData.nama_lokasi || '',
        no_pos: editData.no_pos || '',
        lat: editData.lat || '',
        lng: editData.lng || '',
        google_maps_li: editData.google_maps_li || ''
      });
    } else {
      setForm({ nama_lokasi: '', no_pos: '', lat: '', lng: '', google_maps_li: '' });
    }
  }, [editData]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_lokasi || !form.no_pos || !form.lat || !form.lng) {
      alert('Nama lokasi, nomor pos, latitude, dan longitude wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editData) {
        await updateDamkar(editData.id, form);
        alert('Pos damkar berhasil diperbarui.');
      } else {
        await createDamkar(form);
        alert('Pos damkar baru berhasil ditambahkan.');
      }
      onSuccess();
    } catch (err) {
      alert('Gagal menyimpan pos damkar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {editData ? <IconEdit size={16} /> : <IconPlus size={16} />}
        <span>{editData ? 'Edit Pos Damkar' : 'Tambah Pos Damkar Baru'}</span>
      </h3>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nama Lokasi</label>
          <input
            type="text"
            name="nama_lokasi"
            value={form.nama_lokasi}
            onChange={handleChange}
            placeholder="Contoh: Pos Damkar Padang Selatan"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nomor Pos</label>
          <input
            type="number"
            name="no_pos"
            value={form.no_pos}
            onChange={handleChange}
            placeholder="Contoh: 8"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Latitude</label>
          <input
            type="number"
            step="any"
            name="lat"
            value={form.lat}
            onChange={handleChange}
            placeholder="Contoh: -0.9492"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Longitude</label>
          <input
            type="number"
            step="any"
            name="lng"
            value={form.lng}
            onChange={handleChange}
            placeholder="Contoh: 100.3543"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label">Link Google Maps (Opsional)</label>
        <input
          type="url"
          name="google_maps_li"
          value={form.google_maps_li}
          onChange={handleChange}
          placeholder="https://maps.google.com/..."
          className="form-input"
        />
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Pos'}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Batal
        </button>
      </div>
    </form>
  );
};

export default DamkarForm;
