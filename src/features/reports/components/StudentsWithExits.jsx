import React from "react";
import { BsBarChartLine, BsSearch } from "react-icons/bs";

const StudentsWithExits = ({ students, searchQuery, onSearchChange, maxStudentExits }) => (
  <section className="report-analysis-column col-12 col-lg-6" aria-labelledby="students-with-exits-heading">
    <div className="report-analysis-card card border-0 shadow-sm p-3 p-md-4 h-100">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <BsBarChartLine className="text-primary" />
          <h2 id="students-with-exits-heading" className="h5 fw-bold mb-0">Uczniowie z wyjściami</h2>
        </div>
        <div className="position-relative" style={{ width: "100%", maxWidth: 230 }}>
          <BsSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="search"
            className="form-control bg-white ps-5"
            placeholder="Szukaj ucznia..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
      <div className="d-flex flex-column gap-2" style={{ maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
        {students.length ? students.map((student) => (
          <div className="d-flex align-items-center gap-3 p-2 px-3 bg-light rounded-3" key={student.id}>
            <span className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 34, height: 34, backgroundColor: student.avatarBg }}>
              {student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
            </span>
            <strong style={{ flex: "0 0 210px", whiteSpace: "nowrap" }}>{student.name}</strong>
            <div className="progress flex-grow-1" style={{ height: 8, minWidth: 0 }}>
              <div className={`progress-bar ${student.exitCount === maxStudentExits ? "bg-warning" : "bg-primary"}`} style={{ width: `${(student.exitCount / maxStudentExits) * 100}%` }} />
            </div>
            <span className={`badge rounded-pill flex-shrink-0 text-center ${student.exitCount === maxStudentExits ? "text-bg-warning" : "text-bg-light"}`} style={{ width: 28 }}>
              {student.exitCount}
            </span>
          </div>
        )) : <p className="text-muted mb-0">Brak wyjść uczniów dzisiaj.</p>}
      </div>
    </div>
  </section>
);

export default StudentsWithExits;