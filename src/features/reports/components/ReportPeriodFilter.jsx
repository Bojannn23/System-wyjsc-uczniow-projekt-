import React from "react";
import { getDateInputValue, getPeriodLabel, normalizeDateInput } from "../utils/reportPeriod.js";

const periods = [
  { value: "day", label: "Dzień" },
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Miesiąc" },
];

const ReportPeriodFilter = ({ period, dateValue, onPeriodChange, onDateChange, isLoading }) => (
  <section className="report-period-filter d-flex flex-column flex-md-row flex-wrap align-items-md-end gap-3 p-3 mb-3 bg-light rounded-3" aria-label="Filtr okresu raportu">
    <div className="report-period-type">
      <span className="form-label fw-semibold d-block mb-2">Zakres raportu</span>
      <div className="btn-group" role="group" aria-label="Wybierz zakres raportu">
        {periods.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn ${period === option.value ? "btn-primary" : "btn-outline-secondary bg-white"}`}
            aria-pressed={period === option.value}
            onClick={() => onPeriodChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    <div className="report-period-date">
      <label htmlFor="report-period-date" className="form-label fw-semibold mb-2 d-block">
        {period === "month" ? "Miesiąc" : period === "week" ? "Dzień z wybranego tygodnia" : "Dzień"}
      </label>
      <input
        id="report-period-date"
        type={period === "month" ? "month" : "date"}
        className="form-control bg-white"
        value={getDateInputValue(period, dateValue)}
        onChange={(event) => {
          if (event.target.value) onDateChange(normalizeDateInput(period, event.target.value, dateValue));
        }}
        required
        style={{ minWidth: "190px" }}
      />
    </div>

    <p className="report-period-status small text-muted mb-2 ms-md-auto" aria-live="polite">
      {isLoading ? "Aktualizuję dane..." : `Pokazany okres: ${getPeriodLabel(period, dateValue)}`}
    </p>
  </section>
);

export default ReportPeriodFilter;