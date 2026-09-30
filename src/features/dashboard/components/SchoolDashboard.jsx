import React from "react";
import {
  BsArrowRepeat,
  BsBarChartLine,
  BsCheckCircleFill,
  BsChevronDown,
  BsClockHistory,
  BsDownload,
  BsGear,
  BsPeopleFill,
  BsSearch,
} from "react-icons/bs";

const SchoolDashboard = ({
  classList,
  selectedClass,
  setSelectedClass,
  currentClassInfo,
  currentStudents,
  currentHistory,
  attendancePercentage,
  searchQuery,
  setSearchQuery,
  renderStatusBadge,
}) => (
  <div className="row g-4 h-100" style={{ minHeight: 0 }}>
    <aside className="col-12 col-xl-3 col-lg-4" style={{ minHeight: 0 }}>
      <div
        className="card border-0 p-4 h-100 d-flex flex-column"
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#f8f7f2",
          borderRadius: "28px",
          border: "1px solid #eae7e0",
        }}
      >
        <h5 className="fw-bold mb-1" style={{ color: "#111827", fontSize: "1.15rem" }}>
          Oddziały szkolne
        </h5>
        <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
          Wybierz klasę, aby przejrzeć listę i logi wyjść.
        </p>
        <div className="btn w-100 d-flex justify-content-between align-items-center mb-3 px-3 py-2 bg-white" style={{ border: "1px solid #e5e2d9", borderRadius: "16px", fontSize: "0.85rem" }}>
          <span>Wszystkie klasy</span>
          <BsChevronDown size={12} />
        </div>

        <div className="d-flex flex-column gap-2 pe-1 overflow-auto" style={{ minHeight: 0 }}>
          {classList.map((schoolClass) => {
            const isActive = selectedClass === schoolClass.id;

            return (
              <button
                type="button"
                key={schoolClass.id}
                onClick={() => setSelectedClass(schoolClass.id)}
                className="text-start p-3"
                style={{
                  cursor: "pointer",
                  backgroundColor: isActive ? "#ffffff" : "#f0eee6",
                  border: isActive ? "2px solid #8b5cf6" : "1px solid #e5e2d9",
                  borderRadius: "18px",
                  boxShadow: isActive ? "0 4px 12px rgba(139, 92, 246, 0.08)" : "none",
                }}
              >
                <span className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold" style={{ color: "#111827", fontSize: "1.05rem" }}>
                    Klasa {schoolClass.name}
                  </span>
                  {isActive && <BsPeopleFill color="#8b5cf6" />}
                </span>
                <span className="d-block fw-semibold text-dark mb-1" style={{ fontSize: "0.82rem" }}>
                  {schoolClass.studentsCount} uczniów
                </span>
                <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>
                  Dzisiaj: <strong className="text-dark">{schoolClass.exitsToday} wyjść</strong>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn w-100 fw-semibold text-white py-2 mt-3"
          style={{ backgroundColor: "#8b5cf6", borderRadius: "16px", fontSize: "0.85rem" }}
        >
          <BsPeopleFill className="me-1" /> Dodaj nową klasę
        </button>
      </div>
    </aside>

    <section className="col-12 col-xl-9 col-lg-8 d-flex flex-column gap-4" style={{ minHeight: 0, overflow: "hidden" }}>
      <section className="card border-0 p-4 shadow-sm flex-shrink-0" style={{ backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="fw-bold mb-0" style={{ color: "#111827", fontSize: "1.6rem" }}>
                Klasa {currentClassInfo?.name || "-"}
              </h1>
              <span className="badge px-2 py-1 rounded-pill" style={{ backgroundColor: "#e9d5ff", color: "#6b21a8", fontSize: "0.75rem" }}>
                Wychowawca: {currentClassInfo?.teacher || "Brak"}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: "0.82rem" }}>
              Podsumowanie bieżących statystyk i obecności.
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <button type="button" className="btn bg-white fw-semibold px-3 py-2" style={{ border: "1px solid #e5e2d9", borderRadius: "14px", fontSize: "0.82rem" }}>
              <BsDownload size={13} /> Eksport
            </button>
            <button type="button" className="btn text-white fw-semibold px-3 py-2" style={{ backgroundColor: "#8b5cf6", borderRadius: "14px", fontSize: "0.82rem" }}>
              <BsArrowRepeat size={14} /> Synchronizuj
            </button>
            <button type="button" className="btn bg-white fw-semibold px-3 py-2" style={{ border: "1px solid #e5e2d9", borderRadius: "14px", fontSize: "0.82rem" }}>
              <BsGear size={13} /> Zarządzaj
            </button>
          </div>
        </div>

        <div className="row g-3">
          <SummaryItem label="Uczniowie" value={currentClassInfo?.studentsCount || 0} icon={<BsPeopleFill size={18} />} color="#8b5cf6" background="#f3e8ff" />
          <SummaryItem label="Aktywne wyjścia" value={currentStudents.filter((student) => student.status === "Na zewnątrz").length} icon={<BsClockHistory size={18} />} color="#d97706" background="#fef3c7" />
          <SummaryItem label="Frekwencja" value={attendancePercentage} icon={<BsCheckCircleFill size={18} />} color="#059669" background="#d1fae5" />
        </div>
      </section>

      <div className="row g-4 flex-grow-1" style={{ minHeight: 0, overflow: "hidden" }}>
        <section className="col-12 col-xl-6" style={{ minHeight: 0 }}>
          <div className="card border-0 p-4 shadow-sm h-100 d-flex flex-column" style={{ minHeight: 0, overflow: "hidden", backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fw-bold mb-0" style={{ color: "#111827", fontSize: "1.1rem" }}>
                Lista uczniów ({currentStudents.length})
              </h2>
              <BsBarChartLine className="text-muted" />
            </div>
            <div className="d-flex flex-column gap-2 overflow-auto" style={{ minHeight: 0 }}>
              {currentStudents.length > 0 ? currentStudents.map((student) => (
                <div key={student.id} className="d-flex align-items-center justify-content-between gap-2 p-3 bg-white" style={{ borderRadius: "16px", border: "1px solid #eae7e0" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: "36px", height: "36px", backgroundColor: student.avatarBg, fontSize: "0.8rem" }}>
                      {student.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div>
                      <span className="fw-bold text-dark d-block" style={{ fontSize: "0.88rem" }}>{student.name}</span>
                      <span className="text-muted" style={{ fontSize: "0.73rem" }}>Ostatnie wyjście: {student.lastExit}</span>
                    </div>
                  </div>
                  {renderStatusBadge(student.status)}
                </div>
              )) : <div className="text-center text-muted p-4 bg-white">Brak uczniów przypisanych do tej klasy.</div>}
            </div>
          </div>
        </section>

        <section className="col-12 col-xl-6" style={{ minHeight: 0 }}>
          <div className="card border-0 p-4 shadow-sm h-100 d-flex flex-column" style={{ minHeight: 0, overflow: "hidden", backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="fw-bold mb-0" style={{ color: "#111827", fontSize: "1.1rem" }}>Historia wyjść dzisiaj</h2>
              <div className="position-relative">
                <BsSearch size={12} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                <input
                  type="search"
                  placeholder="Szukaj..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="form-control bg-white shadow-sm ps-4 py-1"
                  style={{ borderRadius: "12px", fontSize: "0.78rem", width: "130px", border: "1px solid #e5e2d9" }}
                />
              </div>
            </div>
            <div className="d-flex flex-column gap-2 overflow-auto" style={{ minHeight: 0 }}>
              {currentHistory.filter((log) => !searchQuery || log.studentName.toLocaleLowerCase("pl-PL").includes(searchQuery.toLocaleLowerCase("pl-PL"))).map((log) => (
                <div key={log.id} className="d-flex align-items-center justify-content-between gap-2 p-3 bg-white" style={{ borderRadius: "16px", border: "1px solid #eae7e0" }}>
                  <div>
                    <span className="fw-bold text-dark d-block" style={{ fontSize: "0.88rem" }}>{log.studentName}</span>
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>Wyjście: <strong className="text-dark">{log.exitTime}</strong> ({log.duration})</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge px-2 py-1" style={{ backgroundColor: "#f3f4f6", color: "#374151", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 500 }}>{log.reason}</span>
                    {renderStatusBadge(log.status)}
                  </div>
                </div>
              ))}
              {currentHistory.length === 0 && <div className="text-center text-muted p-4 bg-white">Brak wyjść zarejestrowanych dla tej klasy.</div>}
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
);

const SummaryItem = ({ label, value, icon, color, background }) => (
  <div className="col-12 col-md-4">
    <div className="bg-white p-3 d-flex align-items-center justify-content-between h-100" style={{ border: "1px solid #eae7e0" }}>
      <div>
        <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: "0.65rem" }}>{label}</span>
        <strong className="d-block" style={{ fontSize: "1.4rem" }}>{value}</strong>
      </div>
      <div className="d-flex align-items-center justify-content-center" style={{ backgroundColor: background, color, borderRadius: "14px", width: "42px", height: "42px" }}>{icon}</div>
    </div>
  </div>
);

export default SchoolDashboard;