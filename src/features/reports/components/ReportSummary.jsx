import React from "react";
import { BsClockHistory, BsPeopleFill } from "react-icons/bs";

const ReportSummary = ({ studentCount, exitCount }) => {
  const items = [
    { label: "Uczniowie", value: studentCount, icon: <BsPeopleFill />, backgroundColor: "var(--app-surface)", color: "var(--app-accent)" },
    { label: "Łącznie wyjść", value: exitCount, icon: <BsClockHistory />, backgroundColor: "#ccfbf1", color: "#0f766e" },
  ];

  return (
    <section className="report-summary row g-3 mb-3" aria-label="Podsumowanie raportu">
      {items.map((item) => (
        <div className="col-12 col-md-6" key={item.label}>
          <div className="report-summary-card card border-0 shadow-sm p-3 d-flex flex-row align-items-center justify-content-between h-100">
            <div>
              <span className="text-uppercase text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>{item.label}</span>
              <strong className="fs-3">{item.value}</strong>
            </div>
            <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 44, height: 44, backgroundColor: item.backgroundColor, color: item.color }}>
              {item.icon}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
};

export default ReportSummary;
