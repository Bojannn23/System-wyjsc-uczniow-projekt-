import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { supabase, hasSupabase } from "../../../shared/lib/supabase.js";
import DashboardLayout from "../../../shared/layouts/DashboardLayout.jsx";
import TeacherDashboard from "../components/TeacherDashboard.jsx";
import DirectorDashboard from "../components/DirectorDashboard.jsx";
import PedagogueDashboard from "../components/PedagogueDashboard.jsx";
import ExitReasonModal from "../components/ExitReasonModal.jsx";
import DashboardMessage from "../components/DashboardMessage.jsx";
import { BsPeopleFill, BsClockHistory, BsCheckCircleFill, BsX } from "react-icons/bs";

const Dashboard = () => {
  const navigate = useNavigate();

  const [selectedClass, setSelectedClass] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [staffMember, setStaffMember] = useState(null);
  const [attendanceByClass, setAttendanceByClass] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [classList, setClassList] = useState([]);
  const [classStudentsData, setClassStudentsData] = useState({});
  const [activityHistoryData, setActivityHistoryData] = useState({});

  // =========================
  // PANEL NAUCZYCIELA
  // =========================

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [activeLessonsByClass, setActiveLessonsByClass] = useState({});
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");

  const [teacherActiveExits, setTeacherActiveExits] = useState([]);

  const [selectedStudentForExit, setSelectedStudentForExit] = useState(null);
  const [exitReason, setExitReason] = useState("");

  const [isSavingTeacherExit, setIsSavingTeacherExit] = useState(false);
  const [teacherExitError, setTeacherExitError] = useState("");

  const [currentTime, setCurrentTime] = useState(Date.now());

  // =========================
  // ZEGAR
  // =========================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // =========================
  // POBIERANIE DANYCH
  // =========================

  useEffect(() => {
    if (!hasSupabase || !supabase) {
      setLoadError("Brak konfiguracji Supabase. Uzupełnij plik .env i uruchom ponownie serwer.");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // =========================
        // PODSTAWOWE DANE
        // =========================

        const [classesResult, studentsResult, staffResult, assignmentsResult, exitsResult, activeExitsResult, attendanceResult] = await Promise.all([
          supabase.from("school_classes").select("id, name"),

          supabase.from("students").select("id, full_name, class_id"),

          supabase.from("staff").select("id, full_name, email, roles:role_id (name)"),

          supabase.from("class_teacher_assignments").select("class_id, teacher_id, role_type"),

          supabase
            .from("student_exits")
            .select(
              `
                id,
                student_id,
                started_at,
                ended_at,
                reason,
                status,
                students:student_id (
                  id,
                  full_name,
                  class_id
                )
              `,
            )
            .gte("started_at", startOfDay.toISOString()),

          supabase
            .from("student_exits")
            .select(
              `
                id,
                student_id,
                started_at,
                ended_at,
                reason,
                status,
                students:student_id (
                  id,
                  full_name,
                  class_id
                )
              `,
            )
            .eq("status", "active"),

          supabase.from("attendance").select(
            `
                student_id,
                status,
                students:student_id (
                  class_id
                )
              `,
          ),
        ]);

        const failedResult = [classesResult, studentsResult, staffResult, assignmentsResult, exitsResult, activeExitsResult, attendanceResult].find((result) => result.error);

        if (failedResult) {
          throw failedResult.error;
        }

        const { data: classesData } = classesResult;
        const { data: studentsData } = studentsResult;
        const { data: teacherData } = staffResult;
        const { data: assignmentsData } = assignmentsResult;
        const { data: exitsData } = exitsResult;
        const { data: activeExitsData } = activeExitsResult;
        const { data: attendanceData } = attendanceResult;

        // =========================
        // AKTUALNY PRACOWNIK
        // =========================

        const currentStaff = (teacherData || []).find((staff) => staff.email === user.email);

        setStaffMember(currentStaff || null);

        // =========================
        // AKTYWNE WYJŚCIA
        // =========================

        setTeacherActiveExits(
          (activeExitsData || [])
            .filter((exit) => exit.students && exit.students.id)
            .map((exit) => ({
              id: exit.id,
              studentId: exit.student_id,
              studentName: exit.students.full_name,
              classId: exit.students.class_id,
              reason: exit.reason || "Inny powód",
              startedAt: exit.started_at,
            })),
        );

        // =========================
        // KLASY NAUCZYCIELA
        // =========================

        if (currentStaff?.roles?.name === "nauczyciel") {
          const { data: assignments, error: assignmentsError } = await supabase
            .from("teacher_classes")
            .select("class_id")
            .eq("teacher_id", currentStaff.id);

          if (assignmentsError) {
            throw assignmentsError;
          }

          const assignedClassIds = Array.from(new Set([
            ...(assignments || []).map((assignment) => assignment.class_id),
            ...(assignmentsData || [])
              .filter((assignment) => assignment.teacher_id === currentStaff.id)
              .map((assignment) => assignment.class_id),
          ]));

          if (assignedClassIds.length === 0) {
            setTeacherClasses([]);
            setActiveLessonsByClass({});
          } else {
            const { data: assignedClasses, error: assignedClassesError } = await supabase
              .from("school_classes")
              .select("id, name")
              .in("id", assignedClassIds);

            if (assignedClassesError) {
              throw assignedClassesError;
            }

            setTeacherClasses(assignedClasses || []);

            const { data: activeLessons, error: activeLessonsError } = await supabase
              .from("lesson_sessions")
              .select("id, class_id, started_at")
              .eq("teacher_id", currentStaff.id)
              .is("ended_at", null)
              .in("class_id", assignedClassIds);

            if (activeLessonsError) {
              throw activeLessonsError;
            }

            setActiveLessonsByClass(
              Object.fromEntries((activeLessons || []).map((lesson) => [lesson.class_id, lesson])),
            );
          }
        }

        // =========================
        // MAPOWANIE NAUCZYCIELI
        // =========================

        const teacherMap = Object.fromEntries((teacherData || []).map((teacher) => [teacher.id, teacher.full_name]));

        // =========================
        // UCZNIOWIE W KLASACH
        // =========================

        const studentMapByClass = {};
        const studentSummaryByClass = {};

        (studentsData || []).forEach((student) => {
          if (!studentMapByClass[student.class_id]) {
            studentMapByClass[student.class_id] = [];
          }

          studentMapByClass[student.class_id].push(student);
        });

        Object.keys(studentMapByClass).forEach((classId) => {
          studentSummaryByClass[classId] = studentMapByClass[classId].map((student) => ({
            id: student.id,
            name: student.full_name,
            status: "Obecna",
            lastExit: "-",
            avatarBg: ["#8b5cf6", "#3b82f6", "#10b981", "#6b7280", "#ec4899", "#f59e0b", "#6366f1"][
              Math.abs(student.id.replaceAll("-", "").length) % 7
            ],
          }));
        });

        // =========================
        // AKTUALIZACJA STATUSÓW UCZNIÓW
        // =========================

        [...(exitsData || []), ...(activeExitsData || [])].forEach((exit) => {
          const student = exit.students;

          if (!student) return;

          const targetClass = student.class_id;

          const classStudents = studentSummaryByClass[targetClass] || [];

          const studentEntry = classStudents.find((item) => item.id === student.id);

          if (!studentEntry) return;

          studentEntry.status = exit.status === "active" ? "Na zewnątrz" : "Wrócił";

          studentEntry.lastExit = exit.ended_at
            ? new Date(exit.ended_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "w trakcie";
        });

        // =========================
        // KLASY DO PANELU GŁÓWNEGO
        // =========================

        const mappedClasses = (classesData || []).map((cls) => ({
          id: cls.id,
          name: cls.name,

          studentsCount: (studentMapByClass[cls.id] || []).length,

          exitsToday: (exitsData || []).filter((exit) => exit.students && exit.students.class_id === cls.id).length,

          teacher:
            teacherMap[
              (assignmentsData || []).find((assignment) => assignment.class_id === cls.id && assignment.role_type === "homeroom")?.teacher_id
            ] || "Brak wychowawcy",
        }));

        // =========================
        // FREKWENCJA
        // =========================

        const attendanceSummary = {};

        (attendanceData || []).forEach((record) => {
          const classId = record.students?.class_id;

          if (!classId) return;

          if (!attendanceSummary[classId]) {
            attendanceSummary[classId] = {
              total: 0,
              present: 0,
            };
          }

          attendanceSummary[classId].total += 1;

          if (record.status === "present" || record.status === "late") {
            attendanceSummary[classId].present += 1;
          }
        });

        // =========================
        // HISTORIA WYJŚĆ
        // =========================

        const historyByClass = {};

        (classesData || []).forEach((cls) => {
          historyByClass[cls.id] = (exitsData || [])
            .filter((exit) => exit.students && exit.students.class_id === cls.id)
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

        // =========================
        // USTAWIENIE DANYCH
        // =========================

        setClassList(mappedClasses);
        setClassStudentsData(studentSummaryByClass);
        setActivityHistoryData(historyByClass);
        setAttendanceByClass(attendanceSummary);

        if (mappedClasses.length > 0) {
          setSelectedClass(mappedClasses[0].id);
        }
      } catch (error) {
        console.error("Błąd pobierania danych z Supabase:", error);

        setLoadError(error.message || "Nie udało się pobrać danych z Supabase.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // =========================
  // WYLOGOWANIE
  // =========================

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate("/");
  };

  const startTeacherLesson = async () => {
    if (!selectedTeacherClass || !staffMember || !supabase) return;

    setIsSavingLesson(true);
    setLessonError("");

    try {
      const { data: lesson, error } = await supabase
        .from("lesson_sessions")
        .insert({
          class_id: selectedTeacherClass.id,
          teacher_id: staffMember.id,
        })
        .select("id, class_id, started_at")
        .single();

      if (error) throw error;

      setActiveLessonsByClass((previous) => ({ ...previous, [lesson.class_id]: lesson }));
    } catch (error) {
      setLessonError(
        error.code === "23505"
          ? "Ta klasa ma już rozpoczętą lekcję. Odśwież panel, aby wczytać jej status."
          : error.message || "Nie udało się rozpocząć lekcji.",
      );
    } finally {
      setIsSavingLesson(false);
    }
  };

  const finishTeacherLesson = async () => {
    if (!selectedTeacherClass || !supabase) return;

    const lesson = activeLessonsByClass[selectedTeacherClass.id];
    if (!lesson) return;

    if (teacherActiveExits.some((exit) => exit.classId === selectedTeacherClass.id)) {
      setLessonError("Najpierw zarejestruj powrót wszystkich uczniów.");
      return;
    }

    setIsSavingLesson(true);
    setLessonError("");

    try {
      const { data, error } = await supabase
        .from("lesson_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", lesson.id)
        .is("ended_at", null)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Ta lekcja została już zakończona.");

      setActiveLessonsByClass((previous) => {
        const next = { ...previous };
        delete next[selectedTeacherClass.id];
        return next;
      });
    } catch (error) {
      setLessonError(error.message || "Nie udało się zakończyć lekcji.");
    } finally {
      setIsSavingLesson(false);
    }
  };

  // =========================
  // OTWARCIE MODALA WYJŚCIA
  // =========================

  const openTeacherExitModal = (student) => {
    if (!activeLessonsByClass[selectedTeacherClass?.id]) {
      setTeacherExitError("Najpierw rozpocznij lekcję dla tej klasy.");
      return;
    }

    setSelectedStudentForExit(student);
    setExitReason("");
    setTeacherExitError("");
  };

  // =========================
  // ZAMKNIĘCIE MODALA
  // =========================

  const closeTeacherExitModal = (force = false) => {
    if (isSavingTeacherExit && !force) {
      return;
    }

    setSelectedStudentForExit(null);
    setExitReason("");
    setTeacherExitError("");
  };

  // =========================
  // DODAWANIE WYJŚCIA
  // =========================

  const saveTeacherExit = async () => {
    const activeLesson = activeLessonsByClass[selectedTeacherClass?.id];
    if (!selectedStudentForExit || !selectedTeacherClass || !activeLesson || !exitReason || !supabase) {
      return;
    }

    setIsSavingTeacherExit(true);
    setTeacherExitError("");

    const startedAt = new Date().toISOString();

    try {
      // =========================
      // ZAPIS DO SUPABASE
      // =========================

      const { data: newExit, error } = await supabase
        .from("student_exits")
        .insert({
          student_id: selectedStudentForExit.id,
          lesson_session_id: activeLesson.id,
          started_at: startedAt,
          reason: exitReason,
          status: "active",
        })
        .select("id, student_id, started_at, reason, status")
        .single();

      if (error) {
        throw error;
      }

      // =========================
      // DODANIE DO LOKALNEGO STANU
      // =========================

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

      // =========================
      // ZMIANA STATUSU UCZNIA
      // =========================

      setClassStudentsData((previous) => ({
        ...previous,

        [selectedTeacherClass.id]: (previous[selectedTeacherClass.id] || []).map((student) =>
          student.id === selectedStudentForExit.id
            ? {
                ...student,
                status: "Na zewnątrz",
                lastExit: "w trakcie",
              }
            : student,
        ),
      }));

      // =========================
      // DODANIE DO HISTORII
      // =========================

      setActivityHistoryData((previous) => ({
        ...previous,

        [selectedTeacherClass.id]: [
          {
            id: newExit.id,
            studentName: selectedStudentForExit.name,
            exitTime: new Date(newExit.started_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            returnTime: "w trakcie",
            duration: "w trakcie",
            reason: newExit.reason || "Brak powodu",
            status: "Na zewnątrz",
          },

          ...(previous[selectedTeacherClass.id] || []),
        ],
      }));

      // =========================
      // ZAMKNIĘCIE MODALA
      // =========================

      closeTeacherExitModal(true);
    } catch (error) {
      console.error("Błąd zapisu wyjścia:", error);

      setTeacherExitError(
        error.code === "23505"
          ? "Ten uczeń ma już aktywne wyjście. Odśwież panel, aby wczytać aktualny status."
          : error.message || "Nie udało się zarejestrować wyjścia.",
      );
    } finally {
      setIsSavingTeacherExit(false);
    }
  };

  // =========================
  // ZAKOŃCZENIE WYJŚCIA
  // =========================

  const finishTeacherExit = async (exit) => {
    if (!supabase) {
      return;
    }

    setTeacherExitError("");

    const endedAt = new Date().toISOString();

    try {
      const { error } = await supabase
        .from("student_exits")
        .update({
          status: "completed",
          ended_at: endedAt,
        })
        .eq("id", exit.id);

      if (error) {
        throw error;
      }

      // =========================
      // USUNIĘCIE Z AKTYWNYCH
      // =========================

      setTeacherActiveExits((previous) => previous.filter((item) => item.id !== exit.id));

      // =========================
      // ZMIANA STATUSU UCZNIA
      // =========================

      setClassStudentsData((previous) => ({
        ...previous,

        [exit.classId]: (previous[exit.classId] || []).map((student) =>
          student.id === exit.studentId
            ? {
                ...student,
                status: "Wrócił",
                lastExit: new Date(endedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : student,
        ),
      }));

      // =========================
      // AKTUALIZACJA HISTORII
      // =========================

      setActivityHistoryData((previous) => ({
        ...previous,

        [exit.classId]: (previous[exit.classId] || []).map((log) => {
          if (log.id !== exit.id) {
            return log;
          }

          const duration = Math.max(1, Math.round((new Date(endedAt) - new Date(exit.startedAt)) / 60000));

          return {
            ...log,
            returnTime: new Date(endedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            duration: `${duration} min`,
            status: "Zakończone",
          };
        }),
      }));
    } catch (error) {
      console.error("Błąd kończenia wyjścia:", error);

      setTeacherExitError(error.message || "Nie udało się zakończyć wyjścia.");
    }
  };

  // =========================
  // INFORMACJE O WYBRANEJ KLASIE
  // =========================

  const currentClassInfo = classList.find((c) => c.id === selectedClass) || classList[0];

  const currentStudents = classStudentsData[selectedClass] || [];

  const currentHistory = activityHistoryData[selectedClass] || [];

  const attendanceSummary = attendanceByClass[selectedClass];

  const attendancePercentage = attendanceSummary?.total
    ? `${((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)}%`
    : "Brak danych";

  // =========================
  // CZY NAUCZYCIEL
  // =========================

  const isTeacher = staffMember?.roles?.name === "nauczyciel";
  const RoleDashboard = staffMember?.roles?.name === "dyrektor" ? DirectorDashboard : PedagogueDashboard;

  // =========================
  // UCZNIOWIE WYBRANEJ KLASY NAUCZYCIELA
  // =========================

  const selectedTeacherStudents = selectedTeacherClass ? classStudentsData[selectedTeacherClass.id] || [] : [];

  const filteredTeacherStudents = selectedTeacherStudents.filter((student) =>
    student.name.toLocaleLowerCase("pl-PL").includes(teacherSearchQuery.toLocaleLowerCase("pl-PL")),
  );

  // =========================
  // AKTYWNE WYJŚCIA WYBRANEJ KLASY
  // =========================

  const selectedClassActiveExits = selectedTeacherClass
    ? teacherActiveExits.filter((exit) => exit.classId === selectedTeacherClass.id)
    : [];
  const selectedClassActiveLesson = selectedTeacherClass
    ? activeLessonsByClass[selectedTeacherClass.id] || null
    : null;

  // =========================
  // CZAS WYJŚCIA
  // =========================

  const formatExitDuration = (startedAt) => {
    const totalSeconds = Math.max(0, Math.floor((currentTime - new Date(startedAt).getTime()) / 1000));

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return <DashboardMessage staffMember={staffMember} onLogout={handleLogout} loading message="Ładowanie danych z Supabase..." />;
  }

  // =========================
  // BŁĄD
  // =========================

  if (loadError) {
    return (
      <DashboardMessage staffMember={staffMember} onLogout={handleLogout} title="Nie udało się pobrać danych" message={loadError} />
    );
  }

  // =========================
  // BRAK KLAS
  // =========================

  if (!isTeacher && classList.length === 0) {
    return (
      <DashboardMessage staffMember={staffMember} onLogout={handleLogout} title="Brak klas w bazie" message="Nie znaleziono żadnych rekordów klas w Supabase." />
    );
  }

  // =========================
  // STATUS
  // =========================

  const renderStatusBadge = (status) => {
    if (status === "Na zewnątrz") {
      return (
        <span
          className="badge px-3 py-1 rounded-pill fw-semibold"
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
          className="badge px-3 py-1 rounded-pill fw-semibold"
          style={{
            backgroundColor: "#d1fae5",
            color: "#047857",
            fontSize: "0.75rem",
          }}
        >
          {status === "Obecna" ? "Obecna" : status === "Wrócił" ? "Wrócił" : "Zakończone"}
        </span>
      );
    }

    return null;
  };

  // =========================
  // RENDER
  // =========================

  return (
    <>
      <DashboardLayout
        staffMember={staffMember}
        onLogout={handleLogout}
        sectionLabel="PANEL SZKOLNY"
        fitViewport={isTeacher && Boolean(selectedTeacherClass)}
      >
        {isTeacher ? (
          <TeacherDashboard
            teacherClasses={teacherClasses}
            selectedTeacherClass={selectedTeacherClass}
            setSelectedTeacherClass={setSelectedTeacherClass}
            teacherSearchQuery={teacherSearchQuery}
            setTeacherSearchQuery={setTeacherSearchQuery}
            selectedTeacherStudents={selectedTeacherStudents}
            filteredTeacherStudents={filteredTeacherStudents}
            selectedClassActiveExits={selectedClassActiveExits}
            activeLesson={selectedClassActiveLesson}
            isSavingLesson={isSavingLesson}
            lessonError={lessonError}
            onStartLesson={startTeacherLesson}
            onFinishLesson={finishTeacherLesson}
            teacherExitError={teacherExitError}
            openTeacherExitModal={openTeacherExitModal}
            formatExitDuration={formatExitDuration}
            finishTeacherExit={finishTeacherExit}
          />
        ) : (
          <RoleDashboard
            classList={classList}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            currentClassInfo={currentClassInfo}
            currentStudents={currentStudents}
            currentHistory={currentHistory}
            attendancePercentage={attendancePercentage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            renderStatusBadge={renderStatusBadge}
          />
        )}
      </DashboardLayout>

      <ExitReasonModal
        student={selectedStudentForExit}
        reason={exitReason}
        error={teacherExitError}
        isSaving={isSavingTeacherExit}
        onReasonChange={setExitReason}
        onClose={closeTeacherExitModal}
        onSave={saveTeacherExit}
      />
    </>
  );
};

export default Dashboard;
