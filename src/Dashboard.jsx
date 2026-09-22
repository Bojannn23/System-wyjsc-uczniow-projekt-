import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { supabase, hasSupabase } from "./lib/supabase";
import { FaGraduationCap } from "react-icons/fa";
import {
  BsList,
  BsX,
  BsPeopleFill,
  BsClockHistory,
  BsCheckCircleFill,
  BsPlusLg,
  BsArrowRepeat,
  BsDownload,
  BsGear,
  BsChevronDown,
  BsGrid1X2,
  BsDoorOpen,
  BsBarChartLine,
  BsQuestionCircle,
  BsBoxArrowRight,
  BsSearch,
  BsExclamationCircleFill,
} from "react-icons/bs";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffMember, setStaffMember] = useState(null);
  const [attendanceByClass, setAttendanceByClass] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [classList, setClassList] = useState([]);

  const [classStudentsData, setClassStudentsData] = useState({});

  const [activityHistoryData, setActivityHistoryData] = useState({});
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherActiveExits, setTeacherActiveExits] = useState([]);
  const [selectedStudentForExit, setSelectedStudentForExit] = useState(null);
  const [exitReason, setExitReason] = useState("");
  const [isSavingTeacherExit, setIsSavingTeacherExit] = useState(false);
  const [teacherExitError, setTeacherExitError] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setLoadError(
        "Brak konfiguracji Supabase. Uzupełnij plik .env i uruchom ponownie serwer.",
      );
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [
          classesResult,
          studentsResult,
          staffResult,
          exitsResult,
          attendanceResult,
        ] = await Promise.all([
          supabase.from("school_classes").select("*"),
          supabase.from("students").select("*"),
          supabase
            .from("staff")
            .select("id, full_name, email, role_id, roles:role_id (name)"),
          supabase
            .from("student_exits")
            .select(
              "id, student_id, started_at, ended_at, reason, status, students:student_id (id, full_name, class_id)",
            )
            .gte("started_at", startOfDay.toISOString()),
          supabase
            .from("attendance")
            .select("student_id, status, students:student_id (class_id)"),
        ]);

        const failedResult = [
          classesResult,
          studentsResult,
          staffResult,
          exitsResult,
          attendanceResult,
        ].find((result) => result.error);
        if (failedResult) throw failedResult.error;

        const { data: classesData } = classesResult;
        const { data: studentsData } = studentsResult;
        const { data: teacherData } = staffResult;
        const { data: exitsData } = exitsResult;
        const { data: attendanceData } = attendanceResult;

        setTeacherActiveExits(
          (exitsData || [])
            .filter((exit) => exit.status === "active" && exit.students)
            .map((exit) => ({
              id: exit.id,
              studentId: exit.student_id,
              studentName: exit.students.full_name,
              classId: exit.students.class_id,
              reason: exit.reason || "Inny powód",
              startedAt: exit.started_at,
            })),
        );

        const currentStaff = (teacherData || []).find(
          (staff) => staff.email === user?.email,
        );
        setStaffMember(currentStaff || null);

        if (currentStaff?.roles?.name === "nauczyciel") {
          const { data: assignments, error: assignmentsError } = await supabase
            .from("teacher_classes")
            .select("class_id")
            .eq("teacher_id", currentStaff.id);

          if (assignmentsError) throw assignmentsError;

          const assignedClassIds = (assignments || []).map(
            (assignment) => assignment.class_id,
          );
          if (assignedClassIds.length === 0) {
            setTeacherClasses([]);
          } else {
            const { data: assignedClasses, error: assignedClassesError } =
              await supabase
                .from("school_classes")
                .select("id, name")
                .in("id", assignedClassIds);

            if (assignedClassesError) throw assignedClassesError;

            setTeacherClasses(assignedClasses || []);
          }
        }

        const teacherMap = Object.fromEntries(
          (teacherData || []).map((teacher) => [teacher.id, teacher.full_name]),
        );
        const studentMapByClass = {};
        const studentSummaryByClass = {};

        (studentsData || []).forEach((student) => {
          if (!studentMapByClass[student.class_id])
            studentMapByClass[student.class_id] = [];
          studentMapByClass[student.class_id].push(student);
        });

        Object.keys(studentMapByClass).forEach((classId) => {
          studentSummaryByClass[classId] = studentMapByClass[classId].map(
            (student) => ({
              id: student.id,
              name: student.full_name,
              status: "Obecna",
              lastExit: "-",
              avatarBg: [
                "#8b5cf6",
                "#3b82f6",
                "#10b981",
                "#6b7280",
                "#ec4899",
                "#f59e0b",
                "#6366f1",
              ][Math.abs(student.id.split("-").join("").length) % 7],
            }),
          );
        });

        (exitsData || []).forEach((exit) => {
          const student = exit.students;
          if (!student) return;
          const targetClass = student.class_id;
          const classStudents = studentSummaryByClass[targetClass] || [];
          const studentEntry = classStudents.find(
            (item) => item.id === student.id,
          );
          if (!studentEntry) return;

          studentEntry.status =
            exit.status === "active" ? "Na zewnątrz" : "Wrócił";
          studentEntry.lastExit = exit.ended_at
            ? new Date(exit.ended_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "w trakcie";
        });

        const mappedClasses = classesData.map((cls) => ({
          id: cls.id,
          name: cls.name,
          studentsCount: (studentMapByClass[cls.id] || []).length,
          exitsToday: (exitsData || []).filter(
            (exit) =>
              exit.students &&
              exit.students.class_id === cls.id &&
              exit.status === "active",
          ).length,
          teacher: teacherMap[cls.homeroom_teacher_id] || "Brak wychowawcy",
        }));

        const attendanceSummary = {};
        (attendanceData || []).forEach((record) => {
          const classId = record.students?.class_id;
          if (!classId) return;
          if (!attendanceSummary[classId])
            attendanceSummary[classId] = { total: 0, present: 0 };
          attendanceSummary[classId].total += 1;
          if (record.status === "present" || record.status === "late")
            attendanceSummary[classId].present += 1;
        });

        const historyByClass = {};
        classesData.forEach((cls) => {
          historyByClass[cls.id] = (exitsData || [])
            .filter(
              (exit) => exit.students && exit.students.class_id === cls.id,
            )
            .map((exit) => ({
              id: exit.id,
              studentName: exit.students?.full_name || "Uczeń",
              exitTime: new Date(exit.started_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              returnTime: exit.ended_at
                ? new Date(exit.ended_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "w trakcie",
              duration: exit.ended_at
                ? `${Math.max(1, Math.round((new Date(exit.ended_at) - new Date(exit.started_at)) / 60000))} min`
                : "w trakcie",
              reason: exit.reason || "Brak powodu",
              status: exit.status === "active" ? "Na zewnątrz" : "Zakończone",
            }));
        });

        setClassList(mappedClasses);
        setClassStudentsData(studentSummaryByClass);
        setActivityHistoryData(historyByClass);
        setAttendanceByClass(attendanceSummary);
        if (mappedClasses.length > 0) {
          setSelectedClass(mappedClasses[0].id);
        }
      } catch (error) {
        console.error("Błąd pobierania danych z Supabase:", error);
        setLoadError(
          error.message || "Nie udało się pobrać danych z Supabase.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate("/");
  };

  const openTeacherExitModal = (student) => {
    setSelectedStudentForExit(student);
    setExitReason("");
    setTeacherExitError("");
  };

  const closeTeacherExitModal = (force = false) => {
    if (isSavingTeacherExit && !force) return;
    setSelectedStudentForExit(null);
    setExitReason("");
    setTeacherExitError("");
  };

  const saveTeacherExit = async () => {
    if (
      !selectedStudentForExit ||
      !selectedTeacherClass ||
      !exitReason ||
      !supabase
    )
      return;

    setIsSavingTeacherExit(true);
    setTeacherExitError("");
    const startedAt = new Date().toISOString();

    try {
      const { data: newExit, error } = await supabase
        .from("student_exits")
        .insert({
          student_id: selectedStudentForExit.id,
          started_at: startedAt,
          reason: exitReason,
          status: "active",
        })
        .select("id, student_id, started_at, reason, status")
        .single();

      if (error) throw error;

      setTeacherActiveExits((previous) => [
        ...previous,
        {
          id: newExit.id,
          studentId: newExit.student_id,
          studentName: selectedStudentForExit.name,
          classId: selectedTeacherClass.id,
          reason: newExit.reason,
          startedAt: newExit.started_at,
        },
      ]);
      setClassStudentsData((previous) => ({
        ...previous,
        [selectedTeacherClass.id]: (
          previous[selectedTeacherClass.id] || []
        ).map((student) =>
          student.id === selectedStudentForExit.id
            ? { ...student, status: "Na zewnątrz", lastExit: "w trakcie" }
            : student,
        ),
      }));
      closeTeacherExitModal(true);
    } catch (error) {
      setTeacherExitError(
        error.message || "Nie udało się zarejestrować wyjścia.",
      );
    } finally {
      setIsSavingTeacherExit(false);
    }
  };

  const finishTeacherExit = async (exit) => {
    if (!supabase) return;

    setTeacherExitError("");
    try {
      const { error } = await supabase
        .from("student_exits")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", exit.id);

      if (error) throw error;

      setTeacherActiveExits((previous) =>
        previous.filter((item) => item.id !== exit.id),
      );
      setClassStudentsData((previous) => ({
        ...previous,
        [exit.classId]: (previous[exit.classId] || []).map((student) =>
          student.id === exit.studentId
            ? {
                ...student,
                status: "Wrócił",
                lastExit: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : student,
        ),
      }));
    } catch (error) {
      setTeacherExitError(error.message || "Nie udało się zakończyć wyjścia.");
    }
  };

  const currentClassInfo =
    classList.find((c) => c.id === selectedClass) || classList[0];
  const currentStudents = classStudentsData[selectedClass] || [];
  const currentHistory = activityHistoryData[selectedClass] || [];
  const attendanceSummary = attendanceByClass[selectedClass];
  const attendancePercentage = attendanceSummary?.total
    ? `${((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)}%`
    : "Brak danych";
  const isTeacher = staffMember?.roles?.name === "nauczyciel";
  const selectedTeacherStudents = selectedTeacherClass
    ? classStudentsData[selectedTeacherClass.id] || []
    : [];
  const filteredTeacherStudents = selectedTeacherStudents.filter((student) =>
    student.name
      .toLocaleLowerCase("pl-PL")
      .includes(teacherSearchQuery.toLocaleLowerCase("pl-PL")),
  );
  const selectedClassActiveExits = selectedTeacherClass
    ? teacherActiveExits.filter(
        (exit) => exit.classId === selectedTeacherClass.id,
      )
    : [];
  const formatExitDuration = (startedAt) => {
    const totalSeconds = Math.max(
      0,
      Math.floor((currentTime - new Date(startedAt).getTime()) / 1000),
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 text-muted">
        Ładowanie danych z Supabase...
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="d-flex align-items-center justify-content-center min-vh-100"
        style={{ backgroundColor: "#f5f4ef" }}
      >
        <div
          className="card border-0 shadow-lg p-4 text-center"
          style={{ maxWidth: "520px" }}
        >
          <h3 className="fw-bold mb-3">Nie udało się pobrać danych</h3>
          <p className="text-muted mb-4">{loadError}</p>
          <button
            onClick={handleLogout}
            className="btn text-white fw-semibold"
            style={{ backgroundColor: "#332f2c" }}
          >
            Wróć do logowania
          </button>
        </div>
      </div>
    );
  }

  if (!isTeacher && classList.length === 0) {
    return (
      <div
        className="d-flex align-items-center justify-content-center min-vh-100"
        style={{
          backgroundColor: "#f5f4ef",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          className="card border-0 shadow-lg p-4 text-center"
          style={{ maxWidth: "480px", width: "100%", borderRadius: "24px" }}
        >
          <div
            className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle text-white mx-auto"
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#ef4444",
            }}
          >
            <BsExclamationCircleFill size={28} />
          </div>
          <h3 className="fw-bold mb-3" style={{ color: "#111827" }}>
            Brak klas w bazie
          </h3>
          <p className="text-muted mb-4" style={{ fontSize: "0.96rem" }}>
            Nie znaleziono żadnych rekordów klas w Supabase. Dodaj klasy w
            bazie, aby dashboard zaczął działać.
          </p>
          <button
            onClick={handleLogout}
            className="btn text-white fw-semibold px-4 py-2"
            style={{ backgroundColor: "#332f2c", borderRadius: "12px" }}
          >
            Wróć do logowania
          </button>
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    if (status === "Na zewnątrz") {
      return (
        <span
          className="badge px-3 py-1.5 rounded-pill fw-semibold"
          style={{
            backgroundColor: "#fef3c7",
            color: "#b45309",
            fontSize: "0.75rem",
          }}
        >
          Na zewnątrz
        </span>
      );
    }
    if (status === "Wrócił" || status === "Zakończone" || status === "Obecna") {
      return (
        <span
          className="badge px-3 py-1.5 rounded-pill fw-semibold"
          style={{
            backgroundColor: "#d1fae5",
            color: "#047857",
            fontSize: "0.75rem",
          }}
        >
          {status === "Obecna"
            ? "Obecna"
            : status === "Wrócił"
              ? "Wrócił"
              : "Zakończone"}
        </span>
      );
    }
    if (status === "Przekroczono czas") {
      return (
        <span
          className="badge px-2.5 py-1.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
          style={{
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            fontSize: "0.75rem",
          }}
        >
          <BsExclamationCircleFill size={10} /> Przekroczono
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className="d-flex flex-column"
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Mobilne menu boczne otwierane przyciskiem w górnym pasku. */}
      {isSidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-30"
          style={{ zIndex: 1040 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className="position-fixed top-0 start-0 h-100 bg-white shadow-lg d-flex flex-column justify-content-between"
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
              <div
                className="d-flex justify-content-center align-items-center rounded-circle text-white"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#111827",
                }}
              >
                <FaGraduationCap size={16} />
              </div>
              <h6 className="fw-bold mb-0 text-dark">Szkolny Węzeł</h6>
            </div>
            <button
              className="btn btn-light rounded-circle p-1"
              onClick={() => setIsSidebarOpen(false)}
            >
              <BsX size={22} />
            </button>
          </div>
          <div className="p-3">
            <span
              className="text-uppercase text-muted fw-bold mb-2 d-block"
              style={{ fontSize: "0.65rem" }}
            >
              MENU GŁÓWNE
            </span>
            <ul className="nav nav-pills flex-column gap-1">
              <li className="nav-item">
                <a
                  href="#klasy"
                  className="nav-link active d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2"
                  style={{ backgroundColor: "#8b5cf6", fontSize: "0.85rem" }}
                >
                  <BsGrid1X2 size={16} /> Klasy i uczniowie
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#wyjscia"
                  className="nav-link text-dark d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <BsDoorOpen size={16} className="text-muted" /> Rejestracja
                  wyjść
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#statystyki"
                  className="nav-link text-dark d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2"
                  style={{ fontSize: "0.85rem" }}
                >
                  <BsBarChartLine size={16} className="text-muted" /> Statystyki
                  i raporty
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="p-3 border-top">
          <a
            href="#pomoc"
            className="nav-link text-dark d-flex align-items-center gap-2 fw-semibold rounded-3 mb-2"
            style={{ fontSize: "0.85rem" }}
          >
            <BsQuestionCircle size={16} className="text-muted" /> Pomoc
          </a>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 py-1.5"
            style={{ fontSize: "0.85rem" }}
          >
            <BsBoxArrowRight size={16} /> Wyloguj się
          </button>
        </div>
      </div>

      {/* Górny pasek: logo, informacje o użytkowniku i wylogowanie. */}
      <nav
        className="navbar navbar-expand border-bottom px-4 py-2"
        style={{
          height: "64px",
          backgroundColor: "#ffffff",
          borderColor: "#f0f0f0",
        }}
      >
        <div className="container-fluid p-0">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn border-0 p-1 text-dark me-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <BsList size={26} />
            </button>
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex justify-content-center align-items-center rounded-circle text-white"
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#111827",
                }}
              >
                <FaGraduationCap size={18} />
              </div>
              <div>
                <h6
                  className="fw-bold mb-0 text-dark"
                  style={{ fontSize: "0.95rem", lineHeight: "1.1" }}
                >
                  Szkolny Węzeł
                </h6>
                <span
                  className="text-uppercase fw-bold text-muted"
                  style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}
                >
                  REJESTRACJA WYJŚĆ
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center gap-2.5 px-3 py-1.5 rounded-pill"
              style={{ backgroundColor: "#f5f4f0" }}
            >
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: "26px",
                  height: "26px",
                  backgroundColor: "#8b5cf6",
                  fontSize: "0.75rem",
                }}
              >
                JN
              </div>
              <span
                className="fw-bold text-dark"
                style={{ fontSize: "0.85rem" }}
              >
                {staffMember?.full_name || "Użytkownik"}{" "}
                <span className="text-muted fw-normal">
                  - {staffMember?.roles?.name || "Pracownik"}
                </span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-light fw-semibold rounded-pill px-3 py-1.5"
              style={{
                fontSize: "0.82rem",
                backgroundColor: "#f5f4f0",
                color: "#111827",
                border: "1px solid #e5e2d9",
              }}
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </nav>

      {/* Nauczyciel ma na razie pustą przestrzeń roboczą; panel pedagoga zachowuje obecny widok. */}
      {isTeacher ? (
        <main
          className="p-4 p-md-5"
          style={{
            height: "calc(100vh - 104px)",
            flex: "0 0 auto",
            minHeight: 0,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
          aria-label="Panel nauczyciela"
        >
          <div
            className="mx-auto h-100"
            style={{ maxWidth: "1100px", minHeight: 0 }}
          >
            {selectedTeacherClass ? (
              <section
                className="h-100 d-flex flex-column"
                aria-labelledby="selected-class-heading"
              >
                <div
                  className="card border-0 p-4 mb-4 shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: "#f8f7f2",
                    borderRadius: "28px",
                    border: "1px solid #eae7e0",
                  }}
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: "54px",
                          height: "54px",
                          backgroundColor: "#8b5cf6",
                          color: "#ffffff",
                        }}
                      >
                        <BsPeopleFill size={24} />
                      </div>
                      <div>
                        <span
                          className="text-uppercase fw-bold text-muted d-block mb-1"
                          style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                        >
                          Moje klasy / wybrana klasa
                        </span>
                        <h1
                          id="selected-class-heading"
                          className="fw-bold mb-0"
                          style={{ color: "#111827", fontSize: "1.6rem" }}
                        >
                          Klasa {selectedTeacherClass.name}
                        </h1>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeacherClass(null);
                        setTeacherSearchQuery("");
                      }}
                      className="btn bg-white fw-semibold px-3 py-2"
                      style={{
                        border: "1px solid #e5e2d9",
                        borderRadius: "14px",
                        color: "#374151",
                      }}
                    >
                      ← Wszystkie moje klasy
                    </button>
                  </div>
                </div>

                {teacherExitError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 flex-shrink-0">
                    {teacherExitError}
                  </div>
                )}

                <div
                  className="row g-4 flex-grow-1"
                  style={{ minHeight: 0, overflow: "hidden" }}
                >
                  <div
                    className="col-12 col-xl-8 d-flex h-100"
                    style={{ minHeight: 0, overflow: "hidden" }}
                  >
                    <div
                      className="card border-0 p-4 shadow-sm w-100 h-100 d-flex flex-column"
                      style={{
                        minHeight: 0,
                        overflow: "hidden",
                        backgroundColor: "#f8f7f2",
                        borderRadius: "28px",
                        border: "1px solid #eae7e0",
                      }}
                    >
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3 flex-shrink-0">
                        <div>
                          <h2
                            className="fw-bold mb-1"
                            style={{ color: "#111827", fontSize: "1.2rem" }}
                          >
                            Lista uczniów
                          </h2>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {selectedTeacherStudents.length} uczniów w klasie
                          </span>
                        </div>
                        <div className="position-relative">
                          <BsSearch
                            size={14}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type="search"
                            value={teacherSearchQuery}
                            onChange={(event) =>
                              setTeacherSearchQuery(event.target.value)
                            }
                            placeholder="Szukaj ucznia..."
                            className="form-control bg-white ps-5 py-2"
                            style={{
                              width: "220px",
                              border: "1px solid #e5e2d9",
                              borderRadius: "14px",
                              fontSize: "0.85rem",
                            }}
                          />
                        </div>
                      </div>

                      <div
                        className="teacher-students-scrollbar d-flex flex-column gap-2 pe-2"
                        style={{
                          height: 0,
                          minHeight: 0,
                          overflowY: "scroll",
                          flex: "1 1 0%",
                        }}
                      >
                        {filteredTeacherStudents.length > 0 ? (
                          filteredTeacherStudents.map((student) => {
                            const isOutside = student.status === "Na zewnątrz";
                            return (
                              <div
                                key={student.id}
                                className="d-flex align-items-center gap-3 p-3 bg-white"
                                style={{
                                  borderRadius: "18px",
                                  border: "1px solid #eae7e0",
                                }}
                              >
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    backgroundColor: student.avatarBg,
                                  }}
                                >
                                  {student.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                  <span
                                    className="fw-semibold d-block"
                                    style={{ color: "#111827" }}
                                  >
                                    {student.name}
                                  </span>
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    {isOutside
                                      ? "Obecnie poza klasą"
                                      : "Obecny w klasie"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openTeacherExitModal(student)}
                                  disabled={isOutside}
                                  className="btn d-flex align-items-center gap-1 fw-semibold px-3 py-2"
                                  style={{
                                    backgroundColor: isOutside
                                      ? "#e5e7eb"
                                      : "#8b5cf6",
                                    color: isOutside ? "#6b7280" : "#ffffff",
                                    borderRadius: "12px",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  <BsPlusLg size={14} /> Wyjście
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center p-5 text-muted bg-white"
                            style={{
                              borderRadius: "18px",
                              border: "1px solid #eae7e0",
                            }}
                          >
                            {selectedTeacherStudents.length === 0
                              ? "Nie ma jeszcze uczniów przypisanych do tej klasy."
                              : "Nie znaleziono ucznia o takiej nazwie."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="col-12 col-xl-4 d-flex h-100"
                    style={{ minHeight: 0, overflow: "hidden" }}
                  >
                    <div
                      className="card border-0 p-4 shadow-sm w-100 h-100 d-flex flex-column"
                      style={{
                        minHeight: 0,
                        overflow: "hidden",
                        backgroundColor: "#f8f7f2",
                        borderRadius: "28px",
                        border: "1px solid #eae7e0",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-3 flex-shrink-0">
                        <div
                          className="d-flex align-items-center justify-content-center"
                          style={{
                            width: "38px",
                            height: "38px",
                            backgroundColor: "#fef3c7",
                            color: "#b45309",
                            borderRadius: "14px",
                          }}
                        >
                          <BsDoorOpen size={18} />
                        </div>
                        <div>
                          <h2
                            className="fw-bold mb-0"
                            style={{ color: "#111827", fontSize: "1.1rem" }}
                          >
                            Aktywne wyjścia
                          </h2>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.78rem" }}
                          >
                            Uczniowie poza klasą
                          </span>
                        </div>
                      </div>
                      <div
                        className="d-flex flex-column gap-2 pe-1"
                        style={{
                          height: 0,
                          minHeight: 0,
                          overflowY: "auto",
                          flex: "1 1 0%",
                        }}
                      >
                        {selectedClassActiveExits.length > 0 ? (
                          selectedClassActiveExits.map((exit) => (
                            <div
                              key={exit.id}
                              className="p-3 bg-white"
                              style={{
                                borderRadius: "18px",
                                border: "1px solid #fde68a",
                              }}
                            >
                              <span
                                className="fw-bold d-block mb-1"
                                style={{ color: "#111827" }}
                              >
                                {exit.studentName}
                              </span>
                              <span
                                className="badge rounded-pill px-2 py-1 mb-3"
                                style={{
                                  backgroundColor: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "0.72rem",
                                }}
                              >
                                {exit.reason}
                              </span>
                              <div
                                className="d-flex align-items-center gap-1 text-muted mb-3"
                                style={{ fontSize: "0.8rem" }}
                              >
                                <BsClockHistory size={13} /> Wyjście trwa:{" "}
                                <strong style={{ color: "#b45309" }}>
                                  {formatExitDuration(exit.startedAt)}
                                </strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => finishTeacherExit(exit)}
                                className="btn w-100 fw-semibold py-2"
                                style={{
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  borderRadius: "12px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Zakończ wyjście
                              </button>
                            </div>
                          ))
                        ) : (
                          <div
                            className="text-center text-muted p-4 bg-white"
                            style={{
                              borderRadius: "18px",
                              border: "1px solid #eae7e0",
                              fontSize: "0.85rem",
                            }}
                          >
                            Brak aktywnych wyjść.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section aria-labelledby="my-classes-heading">
                <div className="mb-4">
                  <h2
                    id="my-classes-heading"
                    className="fw-bold mb-1"
                    style={{ color: "#111827" }}
                  >
                    Moje klasy
                  </h2>
                  <p className="text-muted mb-0">
                    Wybierz klasę, z którą chcesz pracować.
                  </p>
                </div>

                {teacherClasses.length > 0 ? (
                  <div className="row g-3">
                    {teacherClasses.map((schoolClass) => (
                      <div
                        className="col-12 col-sm-6 col-lg-4"
                        key={schoolClass.id}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherClass(schoolClass)}
                          className="card border-0 w-100 h-100 text-start p-4 shadow-sm"
                          style={{
                            backgroundColor: "#f8f7f2",
                            border: "1px solid #eae7e0",
                            borderRadius: "24px",
                            cursor: "pointer",
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <span
                                className="text-uppercase fw-bold text-muted d-block mb-2"
                                style={{
                                  fontSize: "0.7rem",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Klasa
                              </span>
                              <h3
                                className="fw-bold mb-0"
                                style={{ color: "#111827" }}
                              >
                                {schoolClass.name}
                              </h3>
                            </div>
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: "46px",
                                height: "46px",
                                backgroundColor: "#8b5cf6",
                                color: "#ffffff",
                              }}
                            >
                              <BsPeopleFill size={20} />
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="card border-0 p-4 text-center"
                    style={{
                      backgroundColor: "#f8f7f2",
                      borderRadius: "24px",
                      border: "1px solid #eae7e0",
                    }}
                  >
                    <p className="text-muted mb-0">
                      Nie przypisano jeszcze żadnych klas do tego nauczyciela.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      ) : (
        <div
          className="container-fluid px-4 py-4"
          style={{
            height: "calc(100vh - 104px)",
            flex: "0 0 auto",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div className="row g-4 h-100" style={{ minHeight: 0 }}>
            {/* Lewy panel: oddziały, przewijana lista klas i stały przycisk dodawania. */}
            <div className="col-12 col-xl-3 col-lg-4" style={{ minHeight: 0 }}>
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
                <div
                  className="d-flex flex-column flex-grow-1 overflow-hidden"
                  style={{ paddingBottom: "64px" }}
                >
                  <h5
                    className="fw-bold mb-1"
                    style={{ color: "#111827", fontSize: "1.15rem" }}
                  >
                    Oddziały szkolne
                  </h5>
                  <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                    Wybierz klasę, aby przejrzeć listę i logi wyjść.
                  </p>

                  <button
                    className="btn w-100 d-flex justify-content-between align-items-center mb-3 px-3 py-2 bg-white"
                    style={{
                      border: "1px solid #e5e2d9",
                      borderRadius: "16px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>Wszystkie klasy</span>
                    <BsChevronDown size={12} />
                  </button>

                  {/* Lista klas przewijana niezależnie od reszty panelu. */}
                  <div
                    className="d-flex flex-column gap-2 pe-1"
                    style={{
                      height: "calc(100vh - 420px)",
                      minHeight: "180px",
                      maxHeight: "calc(100vh - 320px)",
                      overflowY: "auto",
                      flex: "0 0 auto",
                    }}
                  >
                    {classList.map((cls) => {
                      const isActive = selectedClass === cls.id;
                      return (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedClass(cls.id)}
                          className="p-3 transition-all"
                          style={{
                            cursor: "pointer",
                            backgroundColor: isActive ? "#ffffff" : "#f0eee6",
                            border: isActive
                              ? "2px solid #8b5cf6"
                              : "1px solid #e5e2d9",
                            borderRadius: "18px",
                            boxShadow: isActive
                              ? "0 4px 12px rgba(139, 92, 246, 0.08)"
                              : "none",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h5
                              className="fw-bold mb-0"
                              style={{ color: "#111827", fontSize: "1.05rem" }}
                            >
                              Klasa {cls.name}
                            </h5>
                            {isActive && (
                              <div
                                className="d-flex justify-content-center align-items-center"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  backgroundColor: "#f3e8ff",
                                  color: "#8b5cf6",
                                  borderRadius: "10px",
                                }}
                              >
                                <BsPeopleFill size={13} />
                              </div>
                            )}
                          </div>
                          <div
                            className="fw-semibold text-dark mb-1"
                            style={{ fontSize: "0.82rem" }}
                          >
                            {cls.studentsCount} uczniów
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            • Dzisiaj:{" "}
                            <strong className="text-dark">
                              {cls.exitsToday} wyjść
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="pt-4"
                  style={{
                    position: "absolute",
                    right: "24px",
                    bottom: "16px",
                    left: "24px",
                    zIndex: 2,
                  }}
                >
                  <button
                    className="btn w-100 fw-semibold text-white py-2.5"
                    style={{
                      backgroundColor: "#8b5cf6",
                      borderRadius: "16px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <BsPlusLg className="me-1.5" /> Dodaj nową klasę
                  </button>
                </div>
              </div>
            </div>

            {/* Prawa część dashboardu z podsumowaniem i rejestrami. */}
            <div
              className="col-12 col-xl-9 col-lg-8 d-flex flex-column gap-4"
              style={{ minHeight: 0, overflow: "hidden" }}
            >
              {/* Nagłówek wybranej klasy oraz akcje zarządzania. */}
              <div
                className="card border-0 p-4 shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: "#f8f7f2",
                  borderRadius: "28px",
                  border: "1px solid #eae7e0",
                }}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h3
                        className="fw-bold mb-0"
                        style={{ color: "#111827", fontSize: "1.6rem" }}
                      >
                        Klasa {currentClassInfo.name}
                      </h3>
                      <span
                        className="badge px-2.5 py-1 rounded-pill"
                        style={{
                          backgroundColor: "#e9d5ff",
                          color: "#6b21a8",
                          fontSize: "0.75rem",
                        }}
                      >
                        Wychowawca: {currentClassInfo.teacher}
                      </span>
                    </div>
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.82rem" }}
                    >
                      Podsumowanie bieżących statystyk i obecności dla wybranej
                      klasy.
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn bg-white fw-semibold px-3 py-2 d-flex align-items-center gap-1.5"
                      style={{
                        border: "1px solid #e5e2d9",
                        borderRadius: "14px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <BsDownload size={13} /> Eksport
                    </button>
                    <button
                      className="btn text-white fw-semibold px-3.5 py-2 d-flex align-items-center gap-1.5"
                      style={{
                        backgroundColor: "#8b5cf6",
                        borderRadius: "14px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <BsArrowRepeat size={14} /> Synchronizuj
                    </button>
                    <button
                      className="btn bg-white fw-semibold px-3 py-2 d-flex align-items-center gap-1.5"
                      style={{
                        border: "1px solid #e5e2d9",
                        borderRadius: "14px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <BsGear size={13} /> Zarządzaj
                    </button>
                  </div>
                </div>

                {/* Trzy karty statystyk; na wąskich ekranach przewijają się poziomo. */}
                <div className="row flex-nowrap g-3 pt-2 overflow-auto">
                  <div className="col-10 col-md-4">
                    <div
                      className="bg-white p-3 d-flex align-items-center justify-content-between h-100"
                      style={{ borderRadius: 0, border: "1px solid #eae7e0" }}
                    >
                      <div>
                        <span
                          className="text-uppercase fw-bold text-muted d-block mb-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          Uczniowie
                        </span>
                        <h4
                          className="fw-bold mb-0"
                          style={{ fontSize: "1.4rem" }}
                        >
                          {currentClassInfo.studentsCount}
                        </h4>
                      </div>
                      <div
                        className="p-2.5 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: "#f3e8ff",
                          color: "#8b5cf6",
                          borderRadius: "14px",
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <BsPeopleFill size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="col-10 col-md-4">
                    <div
                      className="bg-white p-3 d-flex align-items-center justify-content-between h-100"
                      style={{ borderRadius: 0, border: "1px solid #eae7e0" }}
                    >
                      <div>
                        <span
                          className="text-uppercase fw-bold text-muted d-block mb-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          Aktywne wyjścia
                        </span>
                        <h4
                          className="fw-bold mb-0"
                          style={{ fontSize: "1.4rem" }}
                        >
                          {
                            currentStudents.filter(
                              (s) => s.status === "Na zewnątrz",
                            ).length
                          }
                        </h4>
                      </div>
                      <div
                        className="p-2.5 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          borderRadius: "14px",
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <BsClockHistory size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="col-10 col-md-4">
                    <div
                      className="bg-white p-3 d-flex align-items-center justify-content-between h-100"
                      style={{ borderRadius: 0, border: "1px solid #eae7e0" }}
                    >
                      <div>
                        <span
                          className="text-uppercase fw-bold text-muted d-block mb-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          Frekwencja
                        </span>
                        <h4
                          className="fw-bold mb-0"
                          style={{ fontSize: "1.4rem" }}
                        >
                          {attendancePercentage}
                        </h4>
                      </div>
                      <div
                        className="p-2.5 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: "#d1fae5",
                          color: "#059669",
                          borderRadius: "14px",
                          width: "42px",
                          height: "42px",
                        }}
                      >
                        <BsCheckCircleFill size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dolne panele mają własne wysokości i niezależne przewijanie. */}
              <div
                className="row g-4"
                style={{
                  height: "calc(100vh - 390px)",
                  marginBottom: "24px",
                  flex: "0 0 auto",
                  minHeight: 0,
                  overflow: "visible",
                }}
              >
                {/* Lista uczniów wybranej klasy. */}
                <div className="col-12 col-xl-6 h-100" style={{ minHeight: 0 }}>
                  <div
                    className="card border-0 p-4 shadow-sm h-100 d-flex flex-column"
                    style={{
                      minHeight: 0,
                      overflow: "hidden",
                      backgroundColor: "#f8f7f2",
                      borderRadius: "28px",
                      borderBottomLeftRadius: "28px",
                      borderBottomRightRadius: "28px",
                      backgroundClip: "padding-box",
                      border: "1px solid #eae7e0",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5
                        className="fw-bold mb-0"
                        style={{ color: "#111827", fontSize: "1.1rem" }}
                      >
                        Lista uczniów ({currentStudents.length})
                      </h5>
                      <button
                        className="btn bg-white border-0 fw-semibold shadow-sm px-3 py-1.5"
                        style={{
                          fontSize: "0.78rem",
                          borderRadius: "12px",
                          border: "1px solid #e5e2d9",
                        }}
                      >
                        Odśwież
                      </button>
                    </div>

                    {/* Lista przewijana wewnątrz karty, bez rozciągania strony. */}
                    <div
                      className="d-flex flex-column gap-2"
                      style={{
                        minHeight: 0,
                        height: 0,
                        padding: "4px 8px 12px 4px",
                        overflowY: "scroll",
                        flex: "1 1 0%",
                      }}
                    >
                      {currentStudents.length > 0 ? (
                        currentStudents.map((student) => (
                          <div
                            key={student.id}
                            className="d-flex align-items-center justify-content-between p-3 bg-white"
                            style={{
                              borderRadius: "16px",
                              border: "1px solid #eae7e0",
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: student.avatarBg,
                                  fontSize: "0.8rem",
                                }}
                              >
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <span
                                  className="fw-bold text-dark d-block"
                                  style={{ fontSize: "0.88rem" }}
                                >
                                  {student.name}
                                </span>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.73rem" }}
                                >
                                  Ostatnie wyjście: {student.lastExit}
                                </span>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              {renderStatusBadge(student.status)}
                              <button
                                className="btn bg-light border-0 fw-semibold px-2.5 py-1"
                                style={{
                                  fontSize: "0.75rem",
                                  borderRadius: "10px",
                                  color: "#374151",
                                }}
                              >
                                Logi
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center h-100 text-muted p-4 bg-white"
                          style={{
                            borderRadius: "16px",
                            border: "1px solid #eae7e0",
                            fontSize: "0.85rem",
                          }}
                        >
                          Brak uczniów przypisanych do tej klasy.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Historia wyjść z wyszukiwaniem i statusami. */}
                <div className="col-12 col-xl-6 h-100" style={{ minHeight: 0 }}>
                  <div
                    className="card border-0 p-4 shadow-sm h-100 d-flex flex-column"
                    style={{
                      minHeight: 0,
                      overflow: "hidden",
                      backgroundColor: "#f8f7f2",
                      borderRadius: "28px",
                      borderBottomLeftRadius: "28px",
                      borderBottomRightRadius: "28px",
                      backgroundClip: "padding-box",
                      border: "1px solid #eae7e0",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5
                        className="fw-bold mb-0"
                        style={{ color: "#111827", fontSize: "1.1rem" }}
                      >
                        Historia wyjść dzisiaj
                      </h5>
                      <div className="position-relative">
                        <BsSearch
                          size={12}
                          className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted"
                        />
                        <input
                          type="text"
                          placeholder="Szukaj..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="form-control bg-white border-0 shadow-sm ps-4 py-1.5"
                          style={{
                            borderRadius: "12px",
                            fontSize: "0.78rem",
                            width: "130px",
                            border: "1px solid #e5e2d9",
                          }}
                        />
                      </div>
                    </div>

                    {/* Wpisy historii przewijane niezależnie od listy uczniów. */}
                    <div
                      className="d-flex flex-column gap-2"
                      style={{
                        minHeight: 0,
                        height: 0,
                        padding: "4px 8px 12px 4px",
                        overflowY: "scroll",
                        flex: "1 1 0%",
                      }}
                    >
                      {currentHistory.length > 0 ? (
                        currentHistory.map((log) => (
                          <div
                            key={log.id}
                            className="d-flex align-items-center justify-content-between p-3 bg-white"
                            style={{
                              borderRadius: "16px",
                              border: "1px solid #eae7e0",
                            }}
                          >
                            <div>
                              <span
                                className="fw-bold text-dark d-block"
                                style={{ fontSize: "0.88rem" }}
                              >
                                {log.studentName}
                              </span>
                              <span
                                className="text-muted"
                                style={{ fontSize: "0.75rem" }}
                              >
                                Wyjście:{" "}
                                <strong className="text-dark">
                                  {log.exitTime}
                                </strong>{" "}
                                ({log.duration})
                              </span>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="badge px-2.5 py-1"
                                style={{
                                  backgroundColor: "#f3f4f6",
                                  color: "#374151",
                                  borderRadius: "10px",
                                  fontSize: "0.75rem",
                                  fontWeight: "500",
                                }}
                              >
                                {log.reason}
                              </span>
                              {renderStatusBadge(log.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center h-100 text-muted p-4 bg-white"
                          style={{
                            borderRadius: "16px",
                            border: "1px solid #eae7e0",
                            fontSize: "0.85rem",
                          }}
                        >
                          Brak wyjść zarejestrowanych dla tej klasy.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stopka aplikacji. */}
      <footer
        className="text-center py-3 mt-auto border-top"
        style={{ borderColor: "#f0f0f0", backgroundColor: "#ffffff" }}
      >
        <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
          Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.
        </p>
      </footer>

      {selectedStudentForExit && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1100, backgroundColor: "rgba(17, 24, 39, 0.56)" }}
          onClick={() => closeTeacherExitModal()}
        >
          <div
            className="card border-0 shadow-lg w-100 p-4 p-md-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            style={{
              maxWidth: "480px",
              borderRadius: "28px",
              backgroundColor: "#f8f7f2",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
              <div>
                <span
                  className="text-uppercase fw-bold text-muted d-block mb-2"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                >
                  Rejestracja wyjścia
                </span>
                <h2
                  id="exit-modal-title"
                  className="fw-bold mb-1"
                  style={{ color: "#111827", fontSize: "1.4rem" }}
                >
                  {selectedStudentForExit.name}
                </h2>
                <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>
                  Wybierz powód wyjścia ucznia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeTeacherExitModal()}
                disabled={isSavingTeacherExit}
                className="btn btn-light rounded-circle p-1"
                aria-label="Zamknij okno"
                style={{ width: "34px", height: "34px" }}
              >
                <BsX size={22} />
              </button>
            </div>

            {teacherExitError && (
              <div
                className="alert alert-danger py-2 px-3"
                style={{ fontSize: "0.85rem" }}
              >
                {teacherExitError}
              </div>
            )}

            <label
              htmlFor="exit-reason"
              className="fw-semibold mb-2"
              style={{ color: "#374151", fontSize: "0.9rem" }}
            >
              Powód wyjścia
            </label>
            <select
              id="exit-reason"
              value={exitReason}
              onChange={(event) => setExitReason(event.target.value)}
              className="form-select bg-white py-2.5 mb-4"
              disabled={isSavingTeacherExit}
              style={{ border: "1px solid #e5e2d9", borderRadius: "14px" }}
            >
              <option value="">Wybierz powód...</option>
              <option value="Toaleta">Wyjście do toalety</option>
              <option value="Inny powód">Wyjście z innego powodu</option>
            </select>

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                onClick={() => closeTeacherExitModal()}
                disabled={isSavingTeacherExit}
                className="btn bg-white fw-semibold px-3 py-2"
                style={{ border: "1px solid #e5e2d9", borderRadius: "12px" }}
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={saveTeacherExit}
                disabled={!exitReason || isSavingTeacherExit}
                className="btn fw-semibold px-4 py-2"
                style={{
                  backgroundColor: "#8b5cf6",
                  color: "#ffffff",
                  borderRadius: "12px",
                }}
              >
                {isSavingTeacherExit ? "Zapisywanie..." : "Zatwierdź wyjście"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
