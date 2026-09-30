import React from "react";
import { BsExclamationCircleFill } from "react-icons/bs";
import DashboardLayout from "../../../shared/layouts/DashboardLayout.jsx";

const DashboardMessage = ({ staffMember, onLogout, title, message, loading = false }) => (
  <DashboardLayout staffMember={staffMember} onLogout={onLogout} sectionLabel="PANEL SZKOLNY">
    <main className="container flex-grow-1 d-flex align-items-center justify-content-center py-4" style={{ minHeight: 0 }}>
      {loading ? (
        <div className="d-flex align-items-center gap-3 text-muted" role="status" aria-live="polite">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>{message}</span>
        </div>
      ) : (
        <section className="card border-0 shadow-lg p-4 text-center mx-auto" style={{ maxWidth: "520px", width: "100%", borderRadius: "24px" }}>
          <BsExclamationCircleFill className="text-danger mb-3 mx-auto" size={32} />
          <h1 className="h3 fw-bold mb-3">{title}</h1>
          <p className="text-muted mb-4">{message}</p>
          <button type="button" onClick={onLogout} className="btn text-white fw-semibold px-4 py-2" style={{ backgroundColor: "#332f2c", borderRadius: "12px" }}>
            Wróć do logowania
          </button>
        </section>
      )}
    </main>
  </DashboardLayout>
);

export default DashboardMessage;
