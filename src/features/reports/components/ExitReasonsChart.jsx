import React from "react";

const REASON_COLORS = [
  "#8b5cf6",
  "#14b8a6",
  "#3b82f6",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#10b981",
  "#6366f1",
];

const getReasonColor = (index) => {
  if (index < REASON_COLORS.length) return REASON_COLORS[index];
  let hue = Math.round(((index - REASON_COLORS.length) * 137.508 + 60) % 360);
  if (hue >= 25 && hue <= 50) hue = (hue + 35) % 360;
  return `hsl(${hue} 68% 50%)`;
};

const ExitReasonsChart = ({ reasons }) => {
  const total = reasons.reduce((sum, [, count]) => sum + count, 0);
  let currentAngle = 0;
  const segments = reasons.map(([, count], index) => {
    const start = currentAngle;
    currentAngle += total ? (count / total) * 100 : 0;
    return `${getReasonColor(index)} ${start}% ${currentAngle}%`;
  });

  return (
    <section className="report-analysis-column col-12 col-lg-6" aria-labelledby="exit-reasons-heading">
      <div className="report-analysis-card card border-0 shadow-sm p-3 p-md-4 h-100">
        <div className="d-flex flex-row align-items-center justify-content-between mb-4">
          <div>
            <h2 id="exit-reasons-heading" className="h5 fw-bold mb-1">Powody wyjść</h2>
            <small className="text-muted">Podział według powodu</small>
          </div>
        </div>
        <div className="report-reasons-content d-flex align-items-center justify-content-center gap-4">
          <div
            className="report-reasons-chart rounded-circle flex-shrink-0"
            role="img"
            aria-label={`Powody wyjść: ${reasons.map(([reason, count]) => `${reason} ${count}`).join(", ") || "brak danych"}`}
            style={{ background: total ? `conic-gradient(${segments.join(", ")})` : "var(--app-border)" }}
          />
          <div className="report-reasons-legend small">
            {reasons.length ? reasons.map(([reason, count], index) => (
              <div className="d-flex align-items-center gap-2" key={reason}>
                <span className="report-reason-swatch rounded-circle" style={{ backgroundColor: getReasonColor(index) }} />
                <span>{reason}:</span>
                <strong>{count}</strong>
              </div>
            )) : <span className="text-muted">Brak wyjść w tym okresie.</span>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExitReasonsChart;
