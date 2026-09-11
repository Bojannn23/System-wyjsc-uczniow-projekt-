import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaGraduationCap } from "react-icons/fa";
import {
  BsArrowRepeat,
  BsBoxArrowRight,
  BsClockHistory,
  BsDoorOpen,
  BsPeopleFill,
  BsSearch,
} from "react-icons/bs";
import { getSupabase, isSupabaseConfigured } from "./lib/supabase";

const ROLE_LABELS = {
  nauczyciel: "Nauczyciel",
  dyrektor: "Dyrektor",
  pedagog: "Pedagog",
};

const formatTime = (value) =>
  new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exits, setExits] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        "Brak konfiguracji Supabase. Skopiuj .env.example jako .env i uzupełnij dane projektu.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const [profileResult, classesResult, studentsResult, exitsResult] =
      await Promise.all([
        client
          .from("profiles")
          .select("first_name,last_name,role,school_id")
          .eq("id", user.id)
          .single(),
        client.from("classes").select("id,name,school_year").order("name"),
        client
          .from("students")
          .select("id,class_id,first_name,last_name")
          .eq("active", true)
          .order("last_name"),
        client
          .from("student_exits")
          .select("id,student_id,started_at,returned_at,reason")
          .order("started_at", { ascending: false }),
      ]);

    const firstError =
      profileResult.error ||
      classesResult.error ||
      studentsResult.error ||
      exitsResult.error;
    if (firstError) {
      setError(
        "Nie udało się pobrać danych. Sprawdź migrację bazy oraz polityki dostępu.",
      );
      setLoading(false);
      return;
    }

    setProfile(profileResult.data);
    setClasses(classesResult.data || []);
    setStudents(studentsResult.data || []);
    setExits(exitsResult.data || []);
    setSelectedClassId(
      (current) => current || classesResult.data?.[0]?.id || null,
    );
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const selectedStudents = students.filter(
    (student) => student.class_id === selectedClassId,
  );
  const selectedStudentIds = new Set(
    selectedStudents.map((student) => student.id),
  );
  const selectedExits = exits.filter((exit) =>
    selectedStudentIds.has(exit.student_id),
  );
  const exitByStudent = useMemo(
    () =>
      selectedExits.reduce((result, exit) => {
        if (!result[exit.student_id]) result[exit.student_id] = [];
        result[exit.student_id].push(exit);
        return result;
      }, {}),
    [selectedExits],
  );
  const visibleExits = selectedExits.filter((exit) => {
    const student = selectedStudents.find(
      (item) => item.id === exit.student_id,
    );
    return `${student?.first_name} ${student?.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const handleLogout = async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading)
    return (
      <main className="min-vh-100 d-flex justify-content-center align-items-center text-muted">
        Ładowanie danych…
      </main>
    );
  if (error)
    return (
      <main className="min-vh-100 d-flex justify-content-center align-items-center p-3">
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      </main>
    );

  return (
    <main
      className="min-vh-100"
      style={{
        background: "#f5f4ef",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <nav className="navbar bg-white border-bottom px-3 px-md-4 py-3">
        <div className="container-fluid p-0">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36, background: "#332f2c" }}
            >
              <FaGraduationCap />
            </div>
            <div>
              <strong className="d-block">Szkolny Węzeł</strong>
              <small className="text-muted text-uppercase">
                Rejestracja wyjść
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="small d-none d-md-inline">
              <strong>
                {profile?.first_name} {profile?.last_name}
              </strong>{" "}
              <span className="text-muted">— {ROLE_LABELS[profile?.role]}</span>
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline-secondary btn-sm"
            >
              <BsBoxArrowRight className="me-1" />
              Wyloguj
            </button>
          </div>
        </div>
      </nav>
      <div className="container-fluid p-3 p-md-4">
        <div className="row g-4">
          <aside className="col-12 col-lg-4 col-xl-3">
            <section className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <h1 className="h5 fw-bold">Twoje oddziały</h1>
              <p className="small text-muted">
                Widoczne są wyłącznie klasy, do których masz uprawnienia.
              </p>
              <div className="d-flex flex-column gap-2">
                {classes.length ? (
                  classes.map((classItem) => {
                    const classStudents = students.filter(
                      (student) => student.class_id === classItem.id,
                    );
                    const active = exits.filter(
                      (exit) =>
                        classStudents.some(
                          (student) => student.id === exit.student_id,
                        ) && !exit.returned_at,
                    ).length;
                    return (
                      <button
                        key={classItem.id}
                        onClick={() => setSelectedClassId(classItem.id)}
                        className="btn text-start p-3 rounded-3"
                        style={{
                          border:
                            selectedClassId === classItem.id
                              ? "2px solid #8b5cf6"
                              : "1px solid #e5e2d9",
                          background:
                            selectedClassId === classItem.id
                              ? "#faf8ff"
                              : "#fff",
                        }}
                      >
                        <strong>Klasa {classItem.name}</strong>
                        <small className="d-block text-muted">
                          {classStudents.length} uczniów · {active} aktywne
                          wyjścia
                        </small>
                      </button>
                    );
                  })
                ) : (
                  <p className="small text-muted mb-0">
                    Nie masz jeszcze przypisanych klas.
                  </p>
                )}
              </div>
            </section>
          </aside>
          <section className="col-12 col-lg-8 col-xl-9">
            {selectedClass ? (
              <>
                <header className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-uppercase small text-muted fw-bold mb-1">
                        {selectedClass.school_year}
                      </p>
                      <h2 className="h3 fw-bold mb-1">
                        Klasa {selectedClass.name}
                      </h2>
                      <p className="text-muted mb-0">
                        Dane aktualizowane z bezpiecznej bazy szkoły.
                      </p>
                    </div>
                    <button className="btn btn-light" onClick={loadDashboard}>
                      <BsArrowRepeat className="me-1" />
                      Odśwież
                    </button>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-6">
                      <div className="bg-light rounded-3 p-3">
                        <small className="text-uppercase text-muted fw-bold">
                          Uczniowie
                        </small>
                        <div className="h4 mb-0">{selectedStudents.length}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light rounded-3 p-3">
                        <small className="text-uppercase text-muted fw-bold">
                          Aktywne wyjścia
                        </small>
                        <div className="h4 mb-0">
                          {
                            selectedExits.filter((exit) => !exit.returned_at)
                              .length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <div className="row g-4">
                  <section className="col-12 col-xl-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                      <h3 className="h5 fw-bold mb-3">
                        <BsPeopleFill className="me-2" />
                        Uczniowie ({selectedStudents.length})
                      </h3>
                      {selectedStudents.map((student) => {
                        const studentExits = exitByStudent[student.id] || [];
                        const latest = studentExits[0];
                        const outside = studentExits.some(
                          (exit) => !exit.returned_at,
                        );
                        return (
                          <div
                            key={student.id}
                            className="d-flex justify-content-between align-items-center border-top py-3"
                          >
                            <div>
                              <strong>
                                {student.first_name} {student.last_name}
                              </strong>
                              <small className="d-block text-muted">
                                {latest
                                  ? `Ostatnie wyjście: ${formatTime(latest.started_at)}`
                                  : "Brak zarejestrowanych wyjść"}
                              </small>
                            </div>
                            <span
                              className={`badge ${outside ? "text-bg-warning" : "text-bg-success"}`}
                            >
                              {outside ? "Na zewnątrz" : "Obecny"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  <section className="col-12 col-xl-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                      <div className="d-flex justify-content-between gap-2 align-items-center mb-3">
                        <h3 className="h5 fw-bold mb-0">
                          <BsDoorOpen className="me-2" />
                          Historia wyjść
                        </h3>
                        <div
                          className="input-group input-group-sm"
                          style={{ maxWidth: 170 }}
                        >
                          <span className="input-group-text bg-white">
                            <BsSearch />
                          </span>
                          <input
                            className="form-control"
                            value={searchQuery}
                            onChange={(event) =>
                              setSearchQuery(event.target.value)
                            }
                            placeholder="Szukaj ucznia"
                          />
                        </div>
                      </div>
                      {visibleExits.length ? (
                        visibleExits.map((exit) => {
                          const student = selectedStudents.find(
                            (item) => item.id === exit.student_id,
                          );
                          return (
                            <div key={exit.id} className="border-top py-3">
                              <div className="d-flex justify-content-between">
                                <strong>
                                  {student?.first_name} {student?.last_name}
                                </strong>
                                <span
                                  className={`badge ${exit.returned_at ? "text-bg-secondary" : "text-bg-warning"}`}
                                >
                                  {exit.returned_at
                                    ? "Zakończone"
                                    : "W trakcie"}
                                </span>
                              </div>
                              <small className="text-muted">
                                {exit.reason} · wyjście:{" "}
                                {formatTime(exit.started_at)}
                                {exit.returned_at &&
                                  ` · powrót: ${formatTime(exit.returned_at)}`}
                              </small>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted small mb-0">
                          Brak wyjść dla wybranego filtra.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
                Wybierz klasę, aby wyświetlić dane.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
