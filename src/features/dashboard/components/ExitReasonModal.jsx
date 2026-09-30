import React from "react";
import { BsX } from "react-icons/bs";

const ExitReasonModal = ({ student, reason, error, isSaving, onReasonChange, onClose, onSave }) => {
  if (!student) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1100, backgroundColor: "rgba(17, 24, 39, 0.56)" }}
      onClick={onClose}
    >
      <div
        className="card border-0 shadow-lg w-100 p-4 p-md-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        style={{ maxWidth: "480px", borderRadius: "28px", backgroundColor: "#f8f7f2" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <span className="text-uppercase fw-bold text-muted d-block mb-2" style={{ fontSize: "0.7rem" }}>
              Rejestracja wyjścia
            </span>
            <h2 id="exit-modal-title" className="fw-bold mb-1" style={{ color: "#111827", fontSize: "1.4rem" }}>
              {student.name}
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>
              Wybierz powód wyjścia ucznia.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn btn-light rounded-circle p-1"
            aria-label="Zamknij okno"
            style={{ width: "34px", height: "34px" }}
          >
            <BsX size={22} />
          </button>
        </div>

        {error && <div className="alert alert-danger py-2 px-3" style={{ fontSize: "0.85rem" }}>{error}</div>}

        <label htmlFor="exit-reason" className="fw-semibold mb-2" style={{ color: "#374151", fontSize: "0.9rem" }}>
          Powód wyjścia
        </label>
        <select
          id="exit-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          className="form-select bg-white py-2 mb-4"
          disabled={isSaving}
          style={{ border: "1px solid #e5e2d9", borderRadius: "14px" }}
        >
          <option value="">Wybierz powód...</option>
          <option value="Toaleta">Wyjście do toalety</option>
          <option value="Inny powód">Wyjście z innego powodu</option>
        </select>

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" onClick={onClose} disabled={isSaving} className="btn bg-white fw-semibold px-3 py-2" style={{ border: "1px solid #e5e2d9", borderRadius: "12px" }}>
            Anuluj
          </button>
          <button type="button" onClick={onSave} disabled={!reason || isSaving} className="btn fw-semibold px-4 py-2" style={{ backgroundColor: "#8b5cf6", color: "#ffffff", borderRadius: "12px" }}>
            {isSaving ? "Zapisywanie..." : "Zatwierdź wyjście"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitReasonModal;
