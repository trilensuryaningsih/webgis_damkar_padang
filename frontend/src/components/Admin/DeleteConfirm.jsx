import React from "react";
import { IconTrash } from "../Icons";

/**
 * Modal konfirmasi hapus.
 * Props:
 *  - nama   : string  — nama item yang akan dihapus (ditampilkan di body)
 *  - onConfirm : fn   — dipanggil saat user klik "Hapus"
 *  - onCancel  : fn   — dipanggil saat user klik "Batal" atau klik backdrop
 */
const DeleteConfirm = ({ nama, onConfirm, onCancel }) => {
  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* stop propagation agar klik di dalam modal tidak menutup */}
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-hover)",
          borderRadius: "12px",
          padding: "28px 24px 20px",
          maxWidth: "380px",
          width: "90%",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "var(--primary-light, #ffe5e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconTrash size={24} color="var(--primary, #e53e3e)" />
          </div>
        </div>

        {/* Judul */}
        <h4
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "700",
            color: "var(--secondary, #1a202c)",
          }}
        >
          Konfirmasi Hapus
        </h4>

        {/* Body */}
        <p
          style={{
            margin: "0 0 24px",
            textAlign: "center",
            fontSize: "14px",
            color: "var(--text-muted, #718096)",
            lineHeight: "1.5",
          }}
        >
          Apakah Anda yakin ingin menghapus{" "}
          <strong style={{ color: "var(--secondary, #1a202c)" }}>
            "{nama}"
          </strong>
          ?
          <br />
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {/* Tombol */}
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ minWidth: "80px" }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ minWidth: "80px" }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirm;
