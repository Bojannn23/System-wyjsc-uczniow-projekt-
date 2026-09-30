import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaGraduationCap } from "react-icons/fa";
import { BsBarChartLine, BsBoxArrowRight, BsGrid1X2, BsList, BsX } from "react-icons/bs";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, staffMember, onLogout, sectionLabel = "PANEL SZKOLNY", fitViewport = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 fw-semibold rounded-3 py-2 ${isActive ? "active text-white" : "text-dark"}`;

  const navLinkStyle = ({ isActive }) => ({
    backgroundColor: isActive ? "#8b5cf6" : "transparent",
    fontSize: "0.85rem",
  });

  return (
    <div
      className={`app-dashboard-shell d-flex flex-column${fitViewport ? " app-dashboard-shell--fit" : ""}`}
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {isSidebarOpen && (
        <button
          type="button"
          className="position-fixed top-0 start-0 w-100 h-100 border-0"
          aria-label="Zamknij menu"
          style={{ zIndex: 1040, backgroundColor: "rgba(17, 24, 39, 0.12)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className="position-fixed top-0 start-0 h-100 bg-white shadow-lg d-flex flex-column justify-content-between"
        aria-label="Nawigacja główna"
        style={{
          width: "260px",
          zIndex: 1050,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease-in-out",
        }}
      >
        <div>
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex justify-content-center align-items-center rounded-circle text-white" style={{ width: "32px", height: "32px", backgroundColor: "#111827" }}>
                <FaGraduationCap size={16} />
              </div>
              <h2 className="h6 fw-bold mb-0 text-dark">Szkolny Węzeł</h2>
            </div>
            <button type="button" className="btn btn-light rounded-circle p-1" onClick={() => setIsSidebarOpen(false)} aria-label="Zamknij menu">
              <BsX size={22} />
            </button>
          </div>

          <nav className="p-3" aria-label="Sekcje systemu">
            <span className="text-uppercase text-muted fw-bold mb-2 d-block" style={{ fontSize: "0.65rem" }}>
              Menu główne
            </span>
            <ul className="nav nav-pills flex-column gap-1">
              <li className="nav-item">
                <NavLink to="/dashboard" end className={navLinkClass} style={navLinkStyle} onClick={() => setIsSidebarOpen(false)}>
                  <BsGrid1X2 size={16} /> Klasy i uczniowie
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/raport" className={navLinkClass} style={navLinkStyle} onClick={() => setIsSidebarOpen(false)}>
                  <BsBarChartLine size={16} /> Raport klasy
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="p-3 border-top">
          <button type="button" className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 py-1" style={{ fontSize: "0.85rem" }} onClick={onLogout}>
            <BsBoxArrowRight size={16} /> Wyloguj się
          </button>
        </div>
      </aside>

      <header className="app-dashboard-header navbar navbar-expand border-bottom px-3 px-md-4 py-2 flex-shrink-0" style={{ height: "64px", backgroundColor: "#ffffff", borderColor: "#f0f0f0" }}>
        <div className="app-dashboard-header-inner container-fluid p-0">
          <div className="app-dashboard-header-brand d-flex align-items-center gap-3">
            <button type="button" className="btn border-0 p-1 text-dark" onClick={() => setIsSidebarOpen(true)} aria-label="Otwórz menu">
              <BsList size={26} />
            </button>
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex justify-content-center align-items-center rounded-circle text-white" style={{ width: "36px", height: "36px", backgroundColor: "#111827" }}>
                <FaGraduationCap size={18} />
              </div>
              <div className="app-dashboard-brand-copy">
                <h1 className="app-dashboard-brand-title h6 fw-bold mb-0 text-dark">Szkolny Węzeł</h1>
                <span className="app-dashboard-section-label text-uppercase fw-bold text-muted" style={{ fontSize: "0.62rem" }}>{sectionLabel}</span>
              </div>
            </div>
          </div>

          <div className="app-dashboard-user-controls d-flex align-items-center gap-3">
            <div className="app-dashboard-account d-flex align-items-center gap-2 px-3 py-1 rounded-pill" title={`${staffMember?.full_name || "Użytkownik"} - ${staffMember?.roles?.name || "Pracownik"}`} style={{ backgroundColor: "#f5f4f0" }}>
              <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "26px", height: "26px", backgroundColor: "#8b5cf6", fontSize: "0.75rem" }}>
                {staffMember?.full_name ? staffMember.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("") : "U"}
              </div>
              <span className="app-dashboard-account-label fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
                {staffMember?.full_name || "Użytkownik"} <span className="text-muted fw-normal">- {staffMember?.roles?.name || "Pracownik"}</span>
              </span>
            </div>
            
          </div>
        </div>
      </header>

      {children}

      <footer className="text-center py-3 mt-auto border-top flex-shrink-0" style={{ borderColor: "#f0f0f0", backgroundColor: "#ffffff" }}>
        <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
          Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.
        </p>
      </footer>
    </div>
  );
};

export default DashboardLayout;
