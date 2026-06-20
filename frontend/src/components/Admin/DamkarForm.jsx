import { useState, useEffect } from "react";
import { createDamkar, updateDamkar } from "../../services/api";
import { IconEdit, IconPlus } from "../Icons";

const Toast = ({ message, type, onDismiss }) => {
  const bg =
    type === "success"
      ? "linear-gradient(135deg, #38a169, #2f855a)"
      : "linear-gradient(135deg, #e53e3e, #c53030)";

  return (
    <div
      style={{
        background: bg,
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#fff",
        fontSize: "13px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        lineHeight: "1.4",
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          padding: "0 2px",
          opacity: 0.8,
          flexShrink: 0,
        }}
        aria-label="Tutup notifikasi"
      >
        ×
      </button>
    </div>
  );
};

const DamkarForm = ({ editData, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    nama_lokasi: "",
    no_pos: "",
    lat: "",
    lng: "",
    google_maps_link: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    let cancelled = false;
    const nextForm = editData
      ? {
          nama_lokasi: editData.nama_lokasi || "",
          no_pos: editData.no_pos || "",
          lat: editData.lat || "",
          lng: editData.lng || "",
          google_maps_link: editData.google_maps_link || "",
        }
      : {
          nama_lokasi: "",
          no_pos: "",
          lat: "",
          lng: "",
          google_maps_link: "",
        };

    queueMicrotask(() => {
      if (cancelled) return;
      setForm(nextForm);
      setToast(null);
    });

    return () => {
      cancelled = true;
    };
  }, [editData]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi manual — tampil sebagai toast, bukan alert
    if (!form.nama_lokasi.trim()) {
      showToast("Nama lokasi wajib diisi.", "error");
      return;
    }
    if (!form.no_pos) {
      showToast("Nomor pos wajib diisi.", "error");
      return;
    }
    if (!form.lat || isNaN(Number(form.lat))) {
      showToast("Latitude wajib diisi dan harus berupa angka.", "error");
      return;
    }
    if (!form.lng || isNaN(Number(form.lng))) {
      showToast("Longitude wajib diisi dan harus berupa angka.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editData) {
        await updateDamkar(editData.id, form);
        showToast("Pos damkar berhasil diperbarui.", "success");
      } else {
        await createDamkar(form);
        showToast("Pos damkar baru berhasil ditambahkan.", "success");
      }
      // Beri waktu agar toast sempat terlihat sebelum onSuccess menutup form
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Terjadi kesalahan.";
      showToast(`Gagal menyimpan pos damkar: ${msg}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: "16px",
          fontWeight: "700",
          color: "var(--secondary)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {editData ? <IconEdit size={16} /> : <IconPlus size={16} />}
        <span>{editData ? "Edit Pos Damkar" : "Tambah Pos Damkar Baru"}</span>
      </h3>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

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
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: "16px" }}>
        <label className="form-label">Link Google Maps (Opsional)</label>
        <input
          type="url"
          name="google_maps_link"
          value={form.google_maps_link}
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
          {isSubmitting
            ? "Menyimpan..."
            : editData
              ? "Simpan Perubahan"
              : "Tambah Pos"}
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
