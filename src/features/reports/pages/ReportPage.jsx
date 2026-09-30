import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ReportPage.css";
import { supabase, hasSupabase } from "../../../shared/lib/supabase.js";
import DashboardLayout from "../../../shared/layouts/DashboardLayout.jsx";
import { BsDownload, BsX } from "react-icons/bs";
import ExitReasonsChart from "../components/ExitReasonsChart.jsx";
import ReportExportConfirmation from "../components/ReportExportConfirmation.jsx";
import ExitCorrectionModal from "../components/ExitCorrectionModal.jsx";
import ReportExitHistory from "../components/ReportExitHistory.jsx";
import ReportSummary from "../components/ReportSummary.jsx";
import ReportPeriodFilter from "../components/ReportPeriodFilter.jsx";
import StudentsWithExits from "../components/StudentsWithExits.jsx";
import { getInitialDate, getPeriodLabel, getPeriodRange } from "../utils/reportPeriod.js";

const Raport = () => {
  const navigate = useNavigate();
  const [staffMember, setStaffMember] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [schoolClass, setSchoolClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [exits, setExits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("day");
  const [dateValue, setDateValue] = useState(getInitialDate);
  const [isExportConfirmationOpen, setIsExportConfirmationOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState("day");
  const [exportDateValue, setExportDateValue] = useState(getInitialDate);
  const [exportExits, setExportExits] = useState([]);
  const [isLoadingExportExits, setIsLoadingExportExits] = useState(false);
  const [exportError, setExportError] = useState("");
  const [isLoadingExits, setIsLoadingExits] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingExit, setEditingExit] = useState(null);
  const isSchoolManager = ["dyrektor", "pedagog"].includes(staffMember?.roles?.name);

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
        const role = staff?.roles?.name;
        if (!staff || !["nauczyciel", "dyrektor", "pedagog"].includes(role)) {
          throw new Error("Brak uprawnień do raportów.");
        }

        setStaffMember(staff);

        if (role === "nauczyciel") {
          const { data: assignment, error: assignmentError } = await supabase
            .from("class_teacher_assignments")
            .select("class_id")
            .eq("teacher_id", staff.id)
            .eq("role_type", "homeroom")
            .limit(1)
            .maybeSingle();

          if (assignmentError) throw assignmentError;
          if (!assignment) throw new Error("Nie znaleziono klasy przypisanej do tego wychowawcy.");

          const { data: classData, error: classError } = await supabase
            .from("school_classes")
            .select("id, name, year")
            .eq("id", assignment.class_id)
            .single();

          if (classError) throw classError;
          setAvailableClasses([classData]);
          setSchoolClass(classData);
        } else {
          const { data: classes, error: classesError } = await supabase
            .from("school_classes")
            .select("id, name, year")
            .order("name");

          if (classesError) throw classesError;
          if (!classes?.length) throw new Error("Nie znaleziono klas do wyświetlenia.");
          setAvailableClasses(classes);
          setSchoolClass(classes[0]);
        }
      } catch (loadError) {
        console.error("Błąd pobierania raportu:", loadError);
        setError(loadError.message || "Nie udało się pobrać raportu.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, []);

  useEffect(() => {
    if (!schoolClass || !supabase) return undefined;

    let isCurrentRequest = true;
    setStudents([]);
    const loadStudents = async () => {
      const { data, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, class_id")
        .eq("class_id", schoolClass.id);

      if (!isCurrentRequest) return;
      if (studentsError) throw studentsError;

      setStudents((data || []).map((student, index) => ({
        id: student.id,
        name: student.full_name,
        exitCount: 0,
        avatarBg: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"][index % 5],
      })));
    };

    loadStudents().catch((loadError) => {
      if (!isCurrentRequest) return;
      setError(loadError.message || "Nie udało się pobrać uczniów klasy.");
    });

    return () => {
      isCurrentRequest = false;
    };
  }, [schoolClass]);

  useEffect(() => {
    if (!schoolClass || !supabase) return undefined;

    let isCurrentRequest = true;
    setExits([]);
    const loadPeriodExits = async () => {
      setIsLoadingExits(true);
      setError("");

      const { start, end } = getPeriodRange(period, dateValue);
      const { data, error: exitsError } = await supabase
        .from("student_exits")
        .select("id, student_id, started_at, ended_at, reason, status, students:student_id!inner (full_name, class_id)")
        .eq("students.class_id", schoolClass.id)
        .gte("started_at", start.toISOString())
        .lt("started_at", end.toISOString());

      if (!isCurrentRequest) return;

      if (exitsError) {
        setError(exitsError.message || "Nie udało się pobrać wyjść z wybranego okresu.");
        setExits([]);
      } else {
        setExits(data || []);
      }

      setIsLoadingExits(false);
    };

    loadPeriodExits().catch((loadError) => {
      if (!isCurrentRequest) return;
      console.error("Błąd pobierania wyjść z okresu:", loadError);
      setError(loadError.message || "Nie udało się pobrać wyjść z wybranego okresu.");
      setExits([]);
      setIsLoadingExits(false);
    });

    return () => {
      isCurrentRequest = false;
    };
  }, [schoolClass, period, dateValue]);

  useEffect(() => {
    if (!isExportConfirmationOpen || !schoolClass || !supabase) return undefined;

    let isCurrentRequest = true;
    const loadExportExits = async () => {
      setIsLoadingExportExits(true);
      setExportError("");

      const { start, end } = getPeriodRange(exportPeriod, exportDateValue);
      const { data, error: exportLoadError } = await supabase
        .from("student_exits")
        .select("id, student_id, started_at, ended_at, reason, status, students:student_id!inner (full_name, class_id)")
        .eq("students.class_id", schoolClass.id)
        .gte("started_at", start.toISOString())
        .lt("started_at", end.toISOString());

      if (!isCurrentRequest) return;

      if (exportLoadError) {
        setExportError(exportLoadError.message || "Nie udało się pobrać danych eksportu.");
        setExportExits([]);
      } else {
        setExportExits(data || []);
      }

      setIsLoadingExportExits(false);
    };

    loadExportExits().catch((loadError) => {
      if (!isCurrentRequest) return;
      console.error("Błąd pobierania danych eksportu:", loadError);
      setExportError(loadError.message || "Nie udało się pobrać danych eksportu.");
      setExportExits([]);
      setIsLoadingExportExits(false);
    });

    return () => {
      isCurrentRequest = false;
    };
  }, [isExportConfirmationOpen, schoolClass, exportPeriod, exportDateValue]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/");
  };

  const exitsByStudent = exits.reduce((summary, exit) => {
    summary[exit.student_id] = (summary[exit.student_id] || 0) + 1;
    return summary;
  }, {});
  const studentsForPeriod = students.map((student) => ({ ...student, exitCount: exitsByStudent[student.id] || 0 }));
  const studentsWithExits = studentsForPeriod
    .filter((student) => student.exitCount > 0)
    .sort((first, second) => second.exitCount - first.exitCount);
  const filteredStudents = studentsWithExits.filter((student) =>
    student.name.toLocaleLowerCase("pl-PL").includes(searchQuery.toLocaleLowerCase("pl-PL")),
  );
  const exitReasonCounts = exits.reduce((summary, exit) => {
    const reason = exit.reason?.trim() || "Brak powodu";
    summary[reason] = (summary[reason] || 0) + 1;
    return summary;
  }, {});
  const exitReasons = Object.entries(exitReasonCounts).sort(([, first], [, second]) => second - first);
  const maxStudentExits = filteredStudents[0]?.exitCount || 1;

  const openExportConfirmation = () => {
    setExportPeriod(period);
    setExportDateValue(dateValue);
    setExportExits(exits);
    setExportError("");
    setIsExportConfirmationOpen(true);
  };

  const handleCorrectionSaved = (updatedExit) => {
    setExits((previous) => previous.map((exit) => exit.id === updatedExit.id ? updatedExit : exit));
    setEditingExit(null);
  };

  const downloadReport = async () => {
    setIsDownloading(true);
    try {
      const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
      ]);
      pdfMake.addVirtualFileSystem(pdfFonts);
      const date = new Date().toLocaleDateString("pl-PL");
      const periodLabel = getPeriodLabel(exportPeriod, exportDateValue);
      const exportCountsByStudent = exportExits.reduce((summary, exit) => {
        summary[exit.student_id] = (summary[exit.student_id] || 0) + 1;
        return summary;
      }, {});
      const exportRows = students
        .filter((student) => exportCountsByStudent[student.id])
        .map((student) => {
          const studentExits = exportExits.filter((exit) => exit.student_id === student.id);
          const reasons = studentExits.reduce((summary, exit) => {
            const reason = exit.reason || "Brak powodu";
            summary[reason] = (summary[reason] || 0) + 1;
            return summary;
          }, {});
          const mostCommonReason = Object.entries(reasons).sort(([, first], [, second]) => second - first)[0]?.[0] || "Brak powodu";
          return { name: student.name, exitCount: exportCountsByStudent[student.id], mostCommonReason };
        })
        .sort((first, second) => second.exitCount - first.exitCount);
      const fileName = `raport-${schoolClass?.name || "klasy"}-${exportPeriod}-${exportDateValue}.pdf`;
      const tableBody = [
        ["Uczeń", "Liczba wyjść", "Najczęstszy powód"],
        ...exportRows.map((row) => [row.name, String(row.exitCount), row.mostCommonReason]),
      ];

      const pdfBlob = await pdfMake
        .createPdf({
          content: [
            { text: `Raport klasy ${schoolClass?.name || ""}`, style: "header" },
            { text: `Wychowawca: ${staffMember?.full_name || "-"} | Okres: ${periodLabel} | Wygenerowano: ${date}`, style: "metadata" },
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
        .getBlob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = fileName;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      setIsExportConfirmationOpen(false);
    } catch (downloadError) {
      setExportError(downloadError.message || "Nie udało się wygenerować raportu PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout staffMember={staffMember} onLogout={handleLogout} sectionLabel="RAPORT KLASY">
        <main className="report-page-main px-3 px-md-4 py-4 py-md-5 d-flex align-items-center justify-content-center">
          <div className="text-muted">Ładowanie raportu...</div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout staffMember={staffMember} onLogout={handleLogout} sectionLabel="RAPORT KLASY">
      <main className="report-page-main px-3 px-md-4 py-3 py-md-4">
        <div className="report-content">
          {error ? (
            <div className="card border-0 shadow-sm p-4 text-center mx-auto" style={{ maxWidth: 560 }}>
              <BsX className="text-danger mb-2" size={40} />
              <h2 className="h4 fw-bold">Nie można wyświetlić raportu</h2>
              <p className="text-muted mb-4">{error}</p>
              <button className="btn text-white" style={{ backgroundColor: "var(--app-ink)" }} onClick={() => navigate("/dashboard")}>Wróć do panelu</button>
            </div>
          ) : (
            <>
              <div className="report-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-3">
                <div>
                  <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.7rem" }}>{isSchoolManager ? "Raport szkolny" : "Raport wychowawcy"}</span>
                  <h2 className="display-6 fw-bold mb-1">Klasa {schoolClass?.name}</h2>
                  <p className="text-muted mb-0">Wyjścia za okres: <strong>{getPeriodLabel(period, dateValue)}</strong></p>
                </div>
                {isSchoolManager && availableClasses.length > 1 && (
                  <div className="report-class-select">
                    <label htmlFor="report-class" className="form-label fw-semibold mb-1">Klasa</label>
                    <select
                      id="report-class"
                      className="form-select bg-white"
                      value={schoolClass?.id || ""}
                      onChange={(event) => setSchoolClass(availableClasses.find((item) => item.id === event.target.value) || null)}
                    >
                      {availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                )}
                <button className="btn btn-primary rounded-pill px-3" onClick={openExportConfirmation} disabled={isLoadingExits || isDownloading}>
                  <BsDownload className="me-1" /> Pobierz raport
                </button>
              </div>

              <ReportPeriodFilter
                period={period}
                dateValue={dateValue}
                onPeriodChange={setPeriod}
                onDateChange={setDateValue}
                isLoading={isLoadingExits}
              />
              <ReportSummary studentCount={students.length} exitCount={exits.length} />

              <div className="report-analysis-grid row g-3 mx-0 mb-3">
                <StudentsWithExits
                  students={filteredStudents}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  maxStudentExits={maxStudentExits}
                />
                <ExitReasonsChart
                  reasons={exitReasons}
                />
              </div>
              <ReportExitHistory exits={exits} canCorrect={isSchoolManager} onCorrect={setEditingExit} />
            </>
          )}
        </div>
      </main>
      {isExportConfirmationOpen && (
        <ReportExportConfirmation
          period={exportPeriod}
          dateValue={exportDateValue}
          exitCount={exportExits.length}
          error={exportError}
          isLoading={isLoadingExportExits}
          isDownloading={isDownloading}
          onPeriodChange={setExportPeriod}
          onDateChange={setExportDateValue}
          onClose={() => setIsExportConfirmationOpen(false)}
          onConfirm={downloadReport}
        />
      )}
      {editingExit && (
        <ExitCorrectionModal
          exit={editingExit}
          onClose={() => setEditingExit(null)}
          onSaved={handleCorrectionSaved}
        />
      )}
    </DashboardLayout>
  );
};

export default Raport;
