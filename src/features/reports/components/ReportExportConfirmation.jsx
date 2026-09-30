import React from "react";
import { BsDownload, BsX } from "react-icons/bs";
import { getDateInputValue, getPeriodLabel, normalizeDateInput } from "../utils/reportPeriod.js";

const periods = [
  { value: "day", label: "Dzień" },
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Miesiąc" },
];

const ReportExportConfirmation = ({ period, dateValue, exitCount, isLoading, isDownloading, onPeriodChange, onDateChange, onClose, onConfirm }) => (
  <div
    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
    style={{ zIndex: 1100, backgroundColor: "rgba(17, 24, 39, 0.52)" }}
    onClick={onClose}
  >
    <section
      className="card border-0 shadow-lg w-100 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-export-title"
      style={{ maxWidth: 460 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: "0.7rem" }}>Eksport raportu</span>
          <h2 id="report-export-title" className="h4 fw-bold mb-0">Potwierdź pobranie</h2>
        </div>
        <button type="button" className="btn btn-light rounded-circle p-1" onClick={onClose} aria-label="Zamknij okno">
          <BsX size={22} />
        </button>
      </div>

      <div className="btn-group w-100 mb-3" role="group" aria-label="Okres eksportu">
        {periods.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn ${period === option.value ? "btn-primary" : "btn-outline-secondary"}`}
            aria-pressed={period === option.value}
            onClick={() => onPeriodChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label htmlFor="report-export-date" className="form-label fw-semibold">
        {period === "month" ? "Miesiąc raportu" : period === "week" ? "Dzień z wybranego tygodnia" : "Dzień raportu"}
      </label>
      <input
        id="report-export-date"
        type={period === "month" ? "month" : "date"}
        className="form-control mb-3"
        value={getDateInputValue(period, dateValue)}
        onChange={(event) => {
          if (event.target.value) onDateChange(normalizeDateInput(period, event.target.value, dateValue));
        }}
        required
      />

      <div className="bg-light rounded-3 p-3 mb-4">
        <div className="d-flex justify-content-between gap-3 mb-1">
          <span className="text-muted">Zakres raportu</span>
          <strong className="text-end">{getPeriodLabel(period, dateValue)}</strong>
        </div>
        <div className="d-flex justify-content-between gap-3">
          <span className="text-muted">Łącznie wyjść</span>
          <strong>{isLoading ? "Pobieranie..." : exitCount}</strong>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-light" onClick={onClose} disabled={isDownloading}>
          Anuluj
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={isLoading || isDownloading}>
          <BsDownload className="me-1" /> {isDownloading ? "Przygotowuję PDF..." : "Potwierdź i pobierz"}
        </button>
      </div>
    </section>
  </div>
);

export default ReportExportConfirmation;
