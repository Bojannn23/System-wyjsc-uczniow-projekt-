import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import "bootstrap/dist/css/bootstrap.min.css";
import { supabase, hasSupabase } from "./lib/supabase";
import { FaGraduationCap } from "react-icons/fa";
import {
  BsBarChartLine,
  BsBoxArrowRight,
  BsClockHistory,
  BsDownload,
  BsGrid1X2,
  BsList,
  BsPeopleFill,
  BsSearch,
  BsX,
} from "react-icons/bs";

pdfMake.addVirtualFileSystem(pdfFonts);

const Raport = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [staffMember, setStaffMember] = useState(null);
  const [schoolClass, setSchoolClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [exits, setExits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      if (!hasSupabase || !supabase) {
        setError("Brak konfiguracji Supabase. Uzupełnij plik .env.");
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("id, full_name, email, roles:role_id (name)")
          .eq("email", user.email)
          .maybeSingle();

        if (staffError) throw staffError;
        if (!staff || staff.roles?.name !== "nauczyciel") {
          throw new Error("Raport klasy jest dostępny tylko dla nauczyciela.");
        }

        setStaffMember(staff);

        const { data: assignment, error: assignmentError } = await supabase
          .from("class_teacher_assignments")
          .select("class_id")
          .eq("teacher_id", staff.id)
          .eq("role_type", "homeroom")
          .limit(1)
          .maybeSingle();

        if (assignmentError) throw assignmentError;
        if (!assignment) {
          setError("Nie znaleziono klasy przypisanej do tego wychowawcy.");
          return;
        }

        const { data: classData, error: classError } = await supabase
          .from("school_classes")
          .select("id, name, year")
          .eq("id", assignment.class_id)
          .single();

        if (classError) throw classError;

        setSchoolClass(classData);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [studentsResult, exitsResult] = await Promise.all([
          supabase.from("students").select("id, full_name, class_id").eq("class_id", classData.id),
          supabase
            .from("student_exits")
            .select("id, student_id, started_at, ended_at, reason, status, students:student_id!inner (full_name, class_id)")
            .eq("students.class_id", classData.id)
            .gte("started_at", startOfDay.toISOString()),
        ]);

        const failedResult = [studentsResult, exitsResult].find((result) => result.error);
        if (failedResult) throw failedResult.error;

        const studentData = studentsResult.data || [];
        const exitData = exitsResult.data || [];
        const exitsByStudent = exitData.reduce((summary, exit) => {
          summary[exit.student_id] = (summary[exit.student_id] || 0) + 1;
          return summary;
        }, {});

        setStudents(
          studentData.map((student, index) => ({
            id: student.id,
            name: student.full_name,
            exitCount: exitsByStudent[student.id] || 0,
            avatarBg: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"][index % 5],
          })),
        );
        setExits(exitData);
      } catch (loadError) {
        console.error("Błąd pobierania raportu:", loadError);
        setError(loadError.message || "Nie udało się pobrać raportu.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/");
  };

  const studentsWithExits = students
    .filter((student) => student.exitCount > 0)
    .sort((first, second) => second.exitCount - first.exitCount);
  const filteredStudents = studentsWithExits.filter((student) =>
    student.name.toLocaleLowerCase("pl-PL").includes(searchQuery.toLocaleLowerCase("pl-PL")),
  );
  const exitReasonCounts = exits.reduce(
    (summary, exit) => {
      const reason = exit.reason === "Toaleta" ? "Toaleta" : "Inne wyjścia";
      summary[reason] += 1;
      return summary;
    },
    { Toaleta: 0, "Inne wyjścia": 0 },
  );
  const exitReasonTotal = exits.length;
  const toiletPercentage = exitReasonTotal ? (exitReasonCounts.Toaleta / exitReasonTotal) * 100 : 0;
  const maxStudentExits = filteredStudents[0]?.exitCount || 1;

  const reportRows = studentsWithExits.map((student) => {
    const reasons = exits
      .filter((exit) => exit.student_id === student.id)
      .reduce((summary, exit) => {
        const reason = exit.reason || "Brak powodu";
        summary[reason] = (summary[reason] || 0) + 1;
        return summary;
      }, {});
    const mostCommonReason = Object.entries(reasons).sort(([, firstCount], [, secondCount]) => secondCount - firstCount)[0]?.[0] || "Brak powodu";

    return { name: student.name, exitCount: student.exitCount, mostCommonReason };
  });

  const downloadReport = () => {
    const date = new Date().toLocaleDateString("pl-PL");
    const fileName = `raport-${schoolClass?.name || "klasy"}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const tableBody = [
      ["Uczeń", "Liczba wyjść", "Najczęstszy powód"],
      ...reportRows.map((row) => [row.name, String(row.exitCount), row.mostCommonReason]),
    ];

    pdfMake
      .createPdf({
        content: [
          { text: `Raport klasy ${schoolClass?.name || ""}`, style: "header" },
          { text: `Wychowawca: ${staffMember?.full_name || "-"} | Data: ${date}`, style: "metadata" },
          {
            table: { headerRows: 1, widths: ["*", "auto", "*"], body: tableBody },
            layout: "lightHorizontalLines",
          },
        ],
        defaultStyle: { font: "Roboto" },
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 8] },
          metadata: { fontSize: 10, color: "#666666", margin: [0, 0, 0, 16] },
        },
      })
      .download(fileName);
  };

  if (isLoading) {
    return <div className="d-flex align-items-center justify-content-center min-vh-100 text-muted">Ładowanie raportu...</div>;
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f5f4ef", color: "#111827", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {isSidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040, backgroundColor: "rgba(17, 24, 39, 0.12)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className="position-fixed top-0 start-0 h-100 bg-white shadow-lg d-flex flex-column"
        style={{
          width: 260,
          zIndex: 1050,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease-in-out",
        }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <strong>Szkolny Węzeł</strong>
          <button className="btn btn-light rounded-circle p-1" onClick={() => setIsSidebarOpen(false)} aria-label="Zamknij menu">
            <BsX size={22} />
          </button>
        </div>
        <nav className="p-3">
          <button className="btn w-100 text-start d-flex align-items-center gap-2 fw-semibold mb-2" onClick={() => navigate("/dashboard")}>
            <BsGrid1X2 /> Klasy i uczniowie
          </button>
          <button className="btn w-100 text-start d-flex align-items-center gap-2 fw-semibold" style={{ backgroundColor: "#f3e8ff", color: "#6d28d9" }}>
            <BsBarChartLine /> Raport klasy
          </button>
        </nav>
        <button className="btn btn-outline-danger mx-3 mt-auto mb-3" onClick={handleLogout}>
          <BsBoxArrowRight className="me-1" /> Wyloguj się
        </button>
      </aside>

      <header className="navbar navbar-expand border-bottom px-3 px-md-4 py-2" style={{ height: 64, backgroundColor: "#ffffff" }}>
        <div className="container-fluid p-0">
          <div className="d-flex align-items-center gap-3">
            <button className="btn border-0 p-1 text-dark" onClick={() => setIsSidebarOpen(true)} aria-label="Otwórz menu">
              <BsList size={26} />
            </button>
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 36, height: 36, backgroundColor: "#111827" }}>
                <FaGraduationCap size={18} />
              </div>
              <div>
                <h1 className="h6 fw-bold mb-0">Szkolny Węzeł</h1>
                <span className="text-muted text-uppercase" style={{ fontSize: "0.62rem" }}>RAPORT KLASY</span>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ backgroundColor: "#f5f4f0" }}>
              <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "26px", height: "26px", backgroundColor: "#8b5cf6", fontSize: "0.75rem" }}>
                {staffMember?.full_name ? staffMember.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("") : "U"}
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: "0.85rem" }}>
                {staffMember?.full_name || "Użytkownik"} <span className="text-muted fw-normal">- {staffMember?.roles?.name || "Pracownik"}</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-light fw-semibold rounded-pill px-3 py-1"
              style={{ fontSize: "0.82rem", backgroundColor: "#f5f4f0", color: "#111827", border: "1px solid #e5e2d9" }}
            >
              <BsBoxArrowRight className="me-1" /> Wyloguj się
            </button>
          </div>
        </div>
      </header>

      <main className="container py-4 py-md-5">
        {error ? (
          <div className="card border-0 shadow-sm p-4 text-center mx-auto" style={{ maxWidth: 560 }}>
            <BsX className="text-danger mb-2" size={40} />
            <h2 className="h4 fw-bold">Nie można wyświetlić raportu</h2>
            <p className="text-muted mb-4">{error}</p>
            <button className="btn text-white" style={{ backgroundColor: "#332f2c" }} onClick={() => navigate("/dashboard")}>Wróć do panelu</button>
          </div>
        ) : (
          <>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
              <div>
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.7rem" }}>Raport wychowawcy</span>
                <h2 className="display-6 fw-bold mb-1">Klasa {schoolClass?.name}</h2>
                <p className="text-muted mb-0">Bieżące podsumowanie wyjść uczniów.</p>
              </div>
              <button className="btn btn-primary rounded-pill px-3" onClick={downloadReport} disabled={!reportRows.length}>
                <BsDownload className="me-1" /> Pobierz raport
              </button>
            </div>

            <div className="row g-3 mb-4">
              {[
                ["Uczniowie", students.length, <BsPeopleFill />, "#f3e8ff", "#8b5cf6"],
                ["Łącznie wyjść", exits.length, <BsClockHistory />, "#fef3c7", "#b45309"],
              ].map(([label, value, icon, backgroundColor, color]) => (
                <div className="col-12 col-md-6" key={label}>
                  <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center justify-content-between h-100">
                    <div>
                      <span className="text-uppercase text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>{label}</span>
                      <strong className="fs-3">{value}</strong>
                    </div>
                    <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 44, height: 44, backgroundColor, color }}>{icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4 mb-4">
                <section className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm p-3 p-md-4 h-100">
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
                      <div className="d-flex align-items-center gap-2"><BsBarChartLine className="text-primary" /><h3 className="h5 fw-bold mb-0">Uczniowie z wyjściami</h3></div>
                      <div className="position-relative" style={{ width: "100%", maxWidth: 230 }}>
                        <BsSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                        <input className="form-control bg-white ps-5" placeholder="Szukaj ucznia..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
                      {filteredStudents.length ? filteredStudents.map((student) => (
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

                <section className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm p-3 p-md-4 h-100">
                    <div className="d-flex flex-row align-items-center justify-content-between mb-4">
                      <div><h3 className="h5 fw-bold mb-1">Powody wyjść</h3><small className="text-muted">Toaleta i inne wyjścia</small></div>
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-4">
                      <div className="rounded-circle flex-shrink-0" style={{ width: 180, height: 180, background: exitReasonTotal ? `conic-gradient(#8b5cf6 0 ${toiletPercentage}%, #f59e0b ${toiletPercentage}% 100%)` : "#e5e7eb" }} />
                      <div className="small">
                        <div className="d-flex align-items-center gap-2 mb-2"><span className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: "#8b5cf6" }} />Toaleta: <strong>{exitReasonCounts.Toaleta}</strong></div>
                        <div className="d-flex align-items-center gap-2"><span className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: "#f59e0b" }} />Inne: <strong>{exitReasonCounts["Inne wyjścia"]}</strong></div>
                      </div>
                    </div>
                  </div>
                </section>
            </div>

          </>
        )}
      </main>
    </div>
  );
};

export default Raport;
