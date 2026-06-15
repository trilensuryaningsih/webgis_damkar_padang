import { useState } from 'react';
import DamkarTable from '../components/Admin/DamkarTable';
import DamkarForm from '../components/Admin/DamkarForm';
import { IconDatabase, IconPlus } from '../components/Icons';

const AdminPage = ({ refresh, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null); // null = Create, {...} = Edit

  const handleTambah = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = (pos) => {
    setEditData(pos);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditData(null);
    onRefresh(); // trigger database refresh for all other panels
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  return (
    <div className="admin-container">
      {/* Header Info */}
      <div className="admin-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconDatabase size={24} color="var(--primary)" />
            <h1 className="admin-title" style={{ margin: 0 }}>Manajemen Data Pos</h1>
          </div>
          <p className="admin-subtitle">
            Tambahkan, perbarui, atau hapus lokasi pos pemadam kebakaran eksisting Kota Padang.
          </p>
        </div>
        {!showForm && (
          <button onClick={handleTambah} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPlus size={16} />
            <span>Tambah Pos Baru</span>
          </button>
        )}
      </div>

      {/* Slide-down Form Card */}
      {showForm && (
        <DamkarForm
          editData={editData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {/* Main Grid Table */}
      <DamkarTable
        onEdit={handleEdit}
        onRefresh={onRefresh}
        refresh={refresh}
      />
    </div>
  );
};

export default AdminPage;

