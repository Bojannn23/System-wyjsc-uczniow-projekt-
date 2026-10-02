import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPencil, BsPlus, BsTrash } from "react-icons/bs";
import DashboardLayout from "../../../shared/layouts/DashboardLayout.jsx";
import DashboardMessage from "../components/DashboardMessage.jsx";
import { hasSupabase, supabase } from "../../../shared/lib/supabase.js";
import "./DirectorManagementPage.css";

const sections = {
  staff: {
    label: "Pracownicy",
    table: "staff",
    fields: [
      { name: "full_name", label: "Imię i nazwisko", required: true },
      { name: "email", label: "E-mail", type: "email" },
      { name: "phone", label: "Telefon" },
      { name: "role_id", label: "Rola", type: "select", options: "roles", required: true },
    ],
    columns: ["full_name", "email", "phone", "role_id"],
  },
  classes: {
    label: "Klasy",
    table: "school_classes",
    fields: [
      { name: "name", label: "Nazwa klasy", required: true },
      { name: "year", label: "Rok", type: "number", required: true },
    ],
    columns: ["name", "year"],
  },
  students: {
    label: "Uczniowie",
    table: "students",
    fields: [
      { name: "full_name", label: "Imię i nazwisko", required: true },
      { name: "class_id", label: "Klasa", type: "select", options: "classes", required: true },
      { name: "student_number", label: "Numer ucznia" },
    ],
    columns: ["full_name", "class_id", "student_number"],
  },
  assignments: {
    label: "Przydziały nauczycieli",
    table: "class_teacher_assignments",
    fields: [
      { name: "teacher_id", label: "Nauczyciel", type: "select", options: "teachers", required: true },
      { name: "class_id", label: "Klasa", type: "select", options: "classes", required: true },
      { name: "role_type", label: "Rodzaj przydziału", type: "select", options: "assignmentTypes", required: true },
    ],
    columns: ["teacher_id", "class_id", "role_type"],
  },
  accounts: {
    label: "Konta logowania",
    table: "staff",
    fields: [
      { name: "full_name", label: "Imię i nazwisko", required: true },
      { name: "email", label: "E-mail", type: "email", required: true },
      { name: "password", label: "Hasło tymczasowe", type: "password", required: true, minLength: 10 },
      { name: "phone", label: "Telefon" },
      { name: "role_id", label: "Rola", type: "select", options: "roles", required: true },
    ],
    columns: ["full_name", "email", "role_id"],
  },
};

const blankData = { staff: [], classes: [], students: [], assignments: [], roles: [] };

const DirectorManagementPage = () => {
  const navigate = useNavigate();
  const [staffMember, setStaffMember] = useState(null);
  const [activeSection, setActiveSection] = useState("staff");
  const [data, setData] = useState(blankData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState({});

  const loadData = useCallback(async () => {
    const requests = await Promise.all([
      supabase.from("staff").select("id, full_name, email, phone, role_id, auth_user_id"),
      supabase.from("school_classes").select("id, name, year").order("name"),
      supabase.from("students").select("id, full_name, class_id, student_number").order("full_name"),
      supabase.from("class_teacher_assignments").select("id, teacher_id, class_id, role_type"),
      supabase.from("roles").select("id, name").order("name"),
    ]);
    const failure = requests.find((result) => result.error);
    if (failure) throw failure.error;
    const [staff, classes, students, assignments, roles] = requests.map((result) => result.data || []);
    setData({ staff, classes, students, assignments, roles });
  }, []);

  useEffect(() => {
    let isActive = true;
    const initialize = async () => {
      if (!hasSupabase || !supabase) {
        setError("Brak konfiguracji Supabase.");
        setIsLoading(false);
        return;
      }
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error("Zaloguj się ponownie, aby kontynuować.");
        const { data: currentStaff, error: staffError } = await supabase
          .from("staff")
          .select("id, full_name, email, roles:role_id (name)")
          .eq("email", authData.user.email)
          .maybeSingle();
        if (staffError) throw staffError;
        if (currentStaff?.roles?.name !== "dyrektor") {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (!isActive) return;
        setStaffMember(currentStaff);
        await loadData();
      } catch (loadError) {
        if (isActive) setError(loadError.message || "Nie udało się pobrać danych.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    initialize();
    return () => { isActive = false; };
  }, [loadData, navigate]);

  const currentConfig = sections[activeSection];
  const activeRecords = activeSection === "accounts" ? data.staff : data[activeSection];

  const optionLists = useMemo(() => ({
    roles: data.roles.map((role) => ({ value: role.id, label: role.name })),
    classes: data.classes.map((schoolClass) => ({ value: schoolClass.id, label: schoolClass.name })),
    teachers: data.staff
      .filter((member) => data.roles.find((role) => role.id === member.role_id)?.name === "nauczyciel")
      .map((teacher) => ({ value: teacher.id, label: teacher.full_name })),
    assignmentTypes: [
      { value: "homeroom", label: "Wychowawca" },
      { value: "subject_teacher", label: "Nauczyciel przedmiotu" },
    ],
  }), [data]);

  const getCellLabel = (field, value) => {
    if (field === "role_id") return data.roles.find((role) => role.id === value)?.name || "-";
    if (field === "class_id") return data.classes.find((item) => item.id === value)?.name || "-";
    if (field === "teacher_id") return data.staff.find((item) => item.id === value)?.full_name || "-";
    if (field === "role_type") return value === "homeroom" ? "Wychowawca" : "Nauczyciel przedmiotu";
    return value || "-";
  };

  const openForm = (record = null) => {
    setEditingRecord(record);
    setIsFormOpen(true);
    setFormValues(Object.fromEntries(currentConfig.fields.map(({ name }) => [name, record?.[name] ?? ""])));
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    const payload = { ...formValues };
    currentConfig.fields.forEach(({ name, type }) => {
      if (payload[name] === "") payload[name] = null;
      else if (type === "number") payload[name] = Number(payload[name]);
    });
    try {
      if (activeSection === "accounts") {
        const { error: functionError } = await supabase.functions.invoke("manage-user", { body: payload });
        if (functionError) throw functionError;
        setIsFormOpen(false);
        setNotice("Konto logowania zostało utworzone.");
        await loadData();
        return;
      }
      const query = supabase.from(currentConfig.table);
      const result = editingRecord
        ? await query.update(payload).eq("id", editingRecord.id)
        : await query.insert(payload);
      if (result.error) throw result.error;
      setIsFormOpen(false);
      setNotice(editingRecord ? "Zmiany zostały zapisane." : "Dodano nowy rekord.");
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "Nie udało się zapisać zmian.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm("Czy na pewno usunąć ten rekord? Powiązane dane mogą zablokować usunięcie.")) return;
    setError("");
    setNotice("");
    const { error: deleteError } = await supabase.from(currentConfig.table).delete().eq("id", record.id);
    if (deleteError) {
      setError(deleteError.message || "Nie udało się usunąć rekordu.");
      return;
    }
    setNotice("Rekord został usunięty.");
    try { await loadData(); } catch (loadError) { setError(loadError.message); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) return <DashboardMessage staffMember={staffMember} onLogout={handleLogout} loading message="Ładowanie panelu zarządzania..." />;

  return (
    <DashboardLayout staffMember={staffMember} onLogout={handleLogout} sectionLabel="ZARZĄDZANIE SZKOŁĄ">
      <main className="director-management container-fluid px-3 px-lg-4 py-4">
        <header className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">Zarządzanie szkołą</h1>
            <p className="text-muted mb-0">Konta, pracownicy, klasy, uczniowie i przydziały</p>
          </div>
          <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openForm()}>
            <BsPlus size={19} /> {activeSection === "accounts" ? "Dodaj konto" : `Dodaj: ${currentConfig.label.toLowerCase()}`}
          </button>
        </header>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}

        <nav className="nav nav-tabs mb-3" aria-label="Kategorie zarządzania">
          {Object.entries(sections).map(([key, section]) => (
            <button key={key} type="button" className={`nav-link ${activeSection === key ? "active" : ""}`} onClick={() => { setActiveSection(key); setEditingRecord(null); setIsFormOpen(false); setError(""); setNotice(""); }}>
              {section.label} <span className="badge text-bg-light ms-1">{key === "accounts" ? data.staff.length : data[key].length}</span>
            </button>
          ))}
        </nav>

        <div className="table-responsive bg-white border rounded-3">
          <table className="table table-hover align-middle mb-0">
            <thead><tr>{currentConfig.columns.map((field) => <th key={field}>{currentConfig.fields.find((item) => item.name === field)?.label}</th>)}<th className="text-end">Akcje</th></tr></thead>
            <tbody>
              {activeRecords.map((record) => (
                <tr key={record.id}>
                  {currentConfig.columns.map((field) => (
                    <td key={field}>{getCellLabel(field, record[field])}{field === "email" && ["staff", "accounts"].includes(activeSection) && record.email ? <small className="d-block text-muted">{record.auth_user_id ? "Konto połączone" : "Rekord bez konta logowania"}</small> : null}</td>
                  ))}
                  <td className="text-end text-nowrap">
                    {activeSection !== "accounts" && <>
                      <button type="button" className="btn btn-sm btn-outline-secondary me-2" aria-label="Edytuj" title="Edytuj" onClick={() => openForm(record)}><BsPencil /></button>
                      <button type="button" className="btn btn-sm btn-outline-danger" aria-label="Usuń" title="Usuń" onClick={() => deleteRecord(record)}><BsTrash /></button>
                    </>}
                    {activeSection === "accounts" && <span className={`badge ${record.auth_user_id ? "text-bg-success" : "text-bg-warning"}`}>{record.auth_user_id ? "Aktywne" : "Brak logowania"}</span>}
                  </td>
                </tr>
              ))}
              {activeRecords.length === 0 && <tr><td colSpan={currentConfig.columns.length + 1} className="text-center text-muted py-5">Brak rekordów.</td></tr>}
            </tbody>
          </table>
        </div>

        {isFormOpen && (
          <div className="director-management-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false); }}>
            <section className="director-management-dialog bg-white rounded-3 shadow p-4" role="dialog" aria-modal="true" aria-labelledby="management-form-title">
              <h2 id="management-form-title" className="h5 fw-bold mb-4">{editingRecord ? "Edytuj" : "Dodaj"}: {currentConfig.label.toLowerCase()}</h2>
              <form onSubmit={handleSubmit}>
                {currentConfig.fields.map((field) => (
                  <div className="mb-3" key={field.name}>
                    <label className="form-label" htmlFor={`management-${field.name}`}>{field.label}</label>
                    {field.type === "select" ? (
                      <select id={`management-${field.name}`} className="form-select" value={formValues[field.name] || ""} onChange={(event) => setFormValues((values) => ({ ...values, [field.name]: event.target.value }))} required={field.required}>
                        <option value="">Wybierz</option>
                        {optionLists[field.options].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : (
                      <input id={`management-${field.name}`} className="form-control" type={field.type || "text"} value={formValues[field.name] ?? ""} onChange={(event) => setFormValues((values) => ({ ...values, [field.name]: event.target.value }))} required={field.required} minLength={field.minLength} autoComplete={field.type === "password" ? "new-password" : undefined} />
                    )}
                  </div>
                ))}
                {activeSection === "accounts" && <p className="small text-muted">Hasło zostanie przekazane do Supabase Auth i nie będzie przechowywane w tabeli pracowników.</p>}
                {activeSection === "staff" && <p className="small text-muted">Ta sekcja zmienia dane pracownika. Konto logowania utworzysz w zakładce „Konta logowania”.</p>}
                {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-light" onClick={() => setIsFormOpen(false)}>Anuluj</button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz"}</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default DirectorManagementPage;
