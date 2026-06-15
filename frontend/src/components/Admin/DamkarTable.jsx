import { useEffect, useState } from "react";
import { getDamkarList, deleteDamkar } from "../../services/api";
import { IconSearch, IconFire, IconEdit, IconTrash } from "../Icons";
import DeleteConfirm from "./DeleteConfirm";

// Ikon link eksternal kecil (inline SVG, tidak perlu import tambahan)
const IconExternalLink = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const DamkarTable = ({ onEdit, onRefresh, refresh }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nama }
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    getDamkarList(search)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching fire stations:", err));
  }, [search, refresh]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, nama } = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteDamkar(id);
      showSuccess(`Pos "${nama}" berhasil dihapus.`);
      onRefresh();
    } catch (err) {
      console.error("Gagal menghapus pos damkar:", err);
    }
  };

  return (
    <div className="table-container">
      {/* Search Filter Header */}
      <div className="table-search">
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Cari berdasarkan nama lokasi atau nomor pos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "36px" }}
          />
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              color: "var(--text-muted)",
            }}
          >
            <IconSearch size={14} />
          </span>
        </div>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div
          style={{
            background: "linear-gradient(135deg, #38a169, #2f855a)",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#fff",
            fontSize: "13px",
            margin: "0 0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "0 2px",
              opacity: 0.8,
            }}
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      )}

      {/* Table Element */}
      <table className="table-element">
        <thead>
          <tr>
            <th style={{ width: "110px" }}>No. Pos</th>
            <th>Nama Lokasi</th>
            <th style={{ width: "190px" }}>Koordinat</th>
            <th style={{ width: "90px", textAlign: "center" }}>Link Maps</th>
            <th style={{ width: "160px", textAlign: "center" }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "24px",
                }}
              >
                {search
                  ? "Pos damkar tidak ditemukan."
                  : "Belum ada data pos damkar."}
              </td>
            </tr>
          ) : (
            data.map((pos) => (
              <tr key={pos.id}>
                {/* No. Pos */}
                <td style={{ fontWeight: "600" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <IconFire size={14} color="var(--primary)" />
                    <span>Pos {pos.no_pos}</span>
                  </div>
                </td>

                {/* Nama Lokasi */}
                <td>{pos.nama_lokasi}</td>

                {/* Koordinat — lat, lng dalam satu kolom monospace */}
                <td
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {parseFloat(pos.lat).toFixed(6)},{" "}
                  {parseFloat(pos.lng).toFixed(6)}
                </td>

                {/* Link Maps */}
                <td style={{ textAlign: "center" }}>
                  {pos.google_maps_link ? (
                    <a
                      href={pos.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka di Google Maps"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--accent)",
                        fontSize: "12px",
                        textDecoration: "none",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "var(--accent-light)",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "0.75")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      <IconExternalLink size={12} />
                      <span>Maps</span>
                    </a>
                  ) : (
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "12px" }}
                    >
                      —
                    </span>
                  )}
                </td>

                {/* Aksi */}
                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() => onEdit(pos)}
                      className="action-btn"
                      style={{
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--accent-light)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                    >
                      <IconEdit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: pos.id, nama: pos.nama_lokasi })
                      }
                      className="action-btn"
                      style={{
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--primary-light)";
                        e.currentTarget.style.color = "var(--primary)";
                      }}
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

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <DeleteConfirm
          nama={deleteTarget.nama}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default DamkarTable;
