import React from "react";
import { BsClockHistory, BsDoorOpen, BsPeopleFill, BsPlayFill, BsPlusLg, BsSearch, BsStopFill } from "react-icons/bs";
import "./TeacherDashboard.css";

const TeacherDashboard = ({
  teacherClasses,
  selectedTeacherClass,
  setSelectedTeacherClass,
  teacherSearchQuery,
  setTeacherSearchQuery,
  selectedTeacherStudents,
  filteredTeacherStudents,
  selectedClassActiveExits,
  activeLesson,
  isSavingLesson,
  lessonError,
  onStartLesson,
  onFinishLesson,
  teacherExitError,
  openTeacherExitModal,
  formatExitDuration,
  finishTeacherExit,
}) => (
  <main className="teacher-dashboard-main p-4 p-md-5" aria-label="Panel nauczyciela">
    <div className="teacher-dashboard-content mx-auto" style={{ maxWidth: "1100px" }}>
      {selectedTeacherClass ? (
        <section className="teacher-selected-class d-flex flex-column" aria-labelledby="selected-class-heading">
          <div className="card border-0 p-4 mb-4 shadow-sm flex-shrink-0" style={{ backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: "54px", height: "54px", backgroundColor: "#8b5cf6" }}>
                  <BsPeopleFill size={24} />
                </div>
                <div>
                  <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: "0.7rem" }}>Moje klasy</span>
                  <h1 id="selected-class-heading" className="fw-bold mb-0" style={{ color: "#111827", fontSize: "1.6rem" }}>Klasa {selectedTeacherClass.name}</h1>
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedTeacherClass(null); setTeacherSearchQuery(""); }} className="btn bg-white fw-semibold px-3 py-2" style={{ border: "1px solid #e5e2d9", borderRadius: "14px", color: "#374151" }}>
                ← Wszystkie moje klasy
              </button>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 px-3 py-3 mb-3 bg-light rounded-3 flex-shrink-0">
            <div>
              <strong className="d-block">{activeLesson ? "Lekcja trwa" : "Lekcja nierozpoczęta"}</strong>
              <span className="small text-muted">
                {activeLesson
                  ? `Rozpoczęto: ${new Date(activeLesson.started_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`
                  : "Rozpocznij lekcję, aby rejestrować wyjścia."}
              </span>
            </div>
            <button
              type="button"
              className={`btn d-flex align-items-center justify-content-center gap-2 fw-semibold ${activeLesson ? "btn-outline-danger" : "btn-success"}`}
              onClick={activeLesson ? onFinishLesson : onStartLesson}
              disabled={isSavingLesson || (Boolean(activeLesson) && selectedClassActiveExits.length > 0)}
            >
              {activeLesson ? <BsStopFill aria-hidden="true" /> : <BsPlayFill aria-hidden="true" />}
              {isSavingLesson ? "Zapisywanie..." : activeLesson ? "Zakończ lekcję" : "Rozpocznij lekcję"}
            </button>
          </div>
          {activeLesson && selectedClassActiveExits.length > 0 && (
            <p className="small text-muted mb-3 flex-shrink-0" role="status">
              Zakończenie lekcji będzie dostępne po powrocie uczniów.
            </p>
          )}
          {lessonError && <div className="alert alert-danger py-2 px-3 mb-3 flex-shrink-0" role="alert">{lessonError}</div>}
          {teacherExitError && <div className="alert alert-danger py-2 px-3 mb-3 flex-shrink-0">{teacherExitError}</div>}

          <div className="teacher-class-panels row g-4">
            <section className="teacher-class-panel col-12 col-lg-8 d-flex">
              <div className="teacher-class-card card border-0 p-4 shadow-sm w-100 d-flex flex-column" style={{ backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3 flex-shrink-0">
                  <div>
                    <h2 className="fw-bold mb-1" style={{ color: "#111827", fontSize: "1.2rem" }}>Lista uczniów</h2>
                    <span className="text-muted" style={{ fontSize: "0.85rem" }}>{selectedTeacherStudents.length} uczniów w klasie</span>
                  </div>
                  <div className="position-relative">
                    <BsSearch size={14} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <input type="search" value={teacherSearchQuery} onChange={(event) => setTeacherSearchQuery(event.target.value)} placeholder="Szukaj ucznia..." className="form-control bg-white ps-5 py-2" style={{ width: "220px", border: "1px solid #e5e2d9", borderRadius: "14px", fontSize: "0.85rem" }} />
                  </div>
                </div>
                <div className="teacher-student-list d-flex flex-column gap-2 pe-2">
                  {filteredTeacherStudents.length ? filteredTeacherStudents.map((student) => {
                    const isOutside = student.status === "Na zewnątrz";
                    return (
                      <div key={student.id} className="d-flex align-items-center gap-3 p-3 bg-white" style={{ borderRadius: "18px", border: "1px solid #eae7e0" }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: "42px", height: "42px", backgroundColor: student.avatarBg }}>
                          {student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <span className="fw-semibold d-block" style={{ color: "#111827" }}>{student.name}</span>
                          <span className="text-muted" style={{ fontSize: "0.78rem" }}>{isOutside ? "Obecnie poza klasą" : "Obecny w klasie"}</span>
                        </div>
                        <button type="button" onClick={() => openTeacherExitModal(student)} disabled={isOutside || !activeLesson} className="btn d-flex align-items-center gap-1 fw-semibold px-3 py-2" style={{ backgroundColor: isOutside || !activeLesson ? "#e5e7eb" : "#8b5cf6", color: isOutside || !activeLesson ? "#6b7280" : "#ffffff", borderRadius: "12px", fontSize: "0.8rem" }} title={!activeLesson ? "Najpierw rozpocznij lekcję" : undefined}>
                          <BsPlusLg size={14} /> Wyjście
                        </button>
                      </div>
                    );
                  }) : <div className="text-center text-muted p-4 bg-white" style={{ borderRadius: "18px" }}>{selectedTeacherStudents.length === 0 ? "Nie ma jeszcze uczniów przypisanych do tej klasy." : "Nie znaleziono ucznia o takiej nazwie."}</div>}
                </div>
              </div>
            </section>

            <section className="teacher-class-panel col-12 col-lg-4 d-flex">
              <div className="teacher-class-card card border-0 p-4 shadow-sm w-100 d-flex flex-column" style={{ backgroundColor: "#f8f7f2", borderRadius: "28px", border: "1px solid #eae7e0" }}>
                <div className="d-flex align-items-center gap-2 mb-3 flex-shrink-0">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px", backgroundColor: "#fef3c7", color: "#b45309", borderRadius: "14px" }}><BsDoorOpen size={18} /></div>
                  <div>
                    <h2 className="fw-bold mb-0" style={{ color: "#111827", fontSize: "1.1rem" }}>Aktywne wyjścia</h2>
                    <span className="text-muted" style={{ fontSize: "0.78rem" }}>Uczniowie poza klasą</span>
                  </div>
                </div>
                <div className="teacher-exit-list d-flex flex-column gap-2 pe-1">
                  {selectedClassActiveExits.length ? selectedClassActiveExits.map((exit) => (
                    <div key={exit.id} className="p-3 bg-white" style={{ borderRadius: "18px", border: "1px solid #fde68a" }}>
                      <span className="fw-bold d-block mb-1" style={{ color: "#111827" }}>{exit.studentName}</span>
                      <span className="badge rounded-pill px-2 py-1 mb-3" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.72rem" }}>{exit.reason}</span>
                      <div className="d-flex align-items-center gap-1 text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                        <BsClockHistory size={13} /> Wyjście trwa: <strong style={{ color: "#b45309" }}>{formatExitDuration(exit.startedAt)}</strong>
                      </div>
                      <button type="button" onClick={() => finishTeacherExit(exit)} className="btn w-100 fw-semibold py-2" style={{ backgroundColor: "#10b981", color: "#ffffff", borderRadius: "12px", fontSize: "0.8rem" }}>Zakończ wyjście</button>
                    </div>
                  )) : <div className="text-center text-muted p-4 bg-white" style={{ borderRadius: "18px" }}>Brak aktywnych wyjść.</div>}
                </div>
              </div>
            </section>
          </div>
        </section>
      ) : (
        <section aria-labelledby="my-classes-heading">
          <div className="mb-4">
            <h2 id="my-classes-heading" className="fw-bold mb-1" style={{ color: "#111827" }}>Moje klasy</h2>
            <p className="text-muted mb-0">Wybierz klasę, z którą chcesz pracować.</p>
          </div>
          {teacherClasses.length ? (
            <div className="row g-3">
              {teacherClasses.map((schoolClass) => (
                <div className="col-12 col-sm-6 col-lg-4" key={schoolClass.id}>
                  <button type="button" onClick={() => setSelectedTeacherClass(schoolClass)} className="card border-0 w-100 h-100 text-start p-4 shadow-sm" style={{ backgroundColor: "#f8f7f2", border: "1px solid #eae7e0", borderRadius: "24px", cursor: "pointer" }}>
                    <span className="d-flex align-items-center justify-content-between">
                      <span><span className="text-uppercase fw-bold text-muted d-block mb-2" style={{ fontSize: "0.7rem" }}>Klasa</span><strong style={{ color: "#111827" }}>{schoolClass.name}</strong></span>
                      <span className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: "46px", height: "46px", backgroundColor: "#8b5cf6" }}><BsPeopleFill size={20} /></span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card border-0 p-4 text-center" style={{ backgroundColor: "#f8f7f2", borderRadius: "24px", border: "1px solid #eae7e0" }}>
              <p className="text-muted mb-0">Nie przypisano jeszcze żadnych klas do tego nauczyciela.</p>
            </div>
          )}
        </section>
      )}
    </div>
  </main>
);

export default TeacherDashboard;
