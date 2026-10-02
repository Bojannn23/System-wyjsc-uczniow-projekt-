import React, { useEffect, useState } from "react";
import { BsX } from "react-icons/bs";
import { supabase } from "../../../shared/lib/supabase.js";

const toLocalInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const describeValues = (values) => {
  if (!values) return "Utworzono wpis wyjścia.";
  const start = values.started_at ? new Date(values.started_at).toLocaleString("pl-PL") : "-";
  const end = values.ended_at ? new Date(values.ended_at).toLocaleString("pl-PL") : "w trakcie";
  return `Powód: ${values.reason || "brak"}; wyjście: ${start}; powrót: ${end}; status: ${values.status}.`;
};

const ExitCorrectionModal = ({ exit, onClose, onSaved }) => {
  const [reason, setReason] = useState(exit.reason || "");
  const [startedAt, setStartedAt] = useState(toLocalInputValue(exit.started_at));
  const [endedAt, setEndedAt] = useState(toLocalInputValue(exit.ended_at));
  const [auditEntries, setAuditEntries] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const loadAudit = async () => {
      if (!supabase) {
        setIsLoadingAudit(false);
        return;
      }

      const { data, error: auditError } = await supabase
        .from("student_exit_audit")
        .select("id, action, changed_at, changed_by_name, old_values, new_values")
        .eq("student_exit_id", exit.id)
        .order("changed_at", { ascending: false });

      if (!isCurrentRequest) return;
      if (auditError) {
        setError(auditError.message || "Nie udało się pobrać historii zmian.");
      } else {
        setAuditEntries(data || []);
      }
      setIsLoadingAudit(false);
    };

    loadAudit().catch((loadError) => {
      if (!isCurrentRequest) return;
      setError(loadError.message || "Nie udało się pobrać historii zmian.");
      setIsLoadingAudit(false);
    });

    return () => {
      isCurrentRequest = false;
    };
  }, [exit.id]);

  const saveCorrection = async (event) => {
    event.preventDefault();
    setError("");

    const startDate = new Date(startedAt);
    const endDate = endedAt ? new Date(endedAt) : null;
    if (Number.isNaN(startDate.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
      setError("Podaj prawidłowy czas wyjścia i powrotu.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("Czas powrotu nie może być wcześniejszy niż czas wyjścia.");
      return;
    }
    if (exit.status === "completed" && !endDate) {
      setError("Zakończone wyjście musi mieć czas powrotu.");
      return;
    }
    if (!supabase) {
      setError("Brak konfiguracji bazy danych.");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error: updateError } = await supabase
        .from("student_exits")
        .update({
          reason: reason.trim() || null,
          started_at: startDate.toISOString(),
          ended_at: endDate?.toISOString() || null,
          status: exit.status === "active" && endDate ? "completed" : exit.status,
        })
        .eq("id", exit.id)
        .select("id, student_id, started_at, ended_at, reason, status, students:student_id!inner (full_name, class_id)")
        .single();

      if (updateError) throw updateError;

      const { data: refreshedAudit, error: refreshedAuditError } = await supabase
        .from("student_exit_audit")
        .select("id, action, changed_at, changed_by_name, old_values, new_values")
        .eq("student_exit_id", exit.id)
        .order("changed_at", { ascending: false });

      if (refreshedAuditError) throw refreshedAuditError;
      setAuditEntries(refreshedAudit || []);
      onSaved(data);
    } catch (saveError) {
      setError(saveError.message || "Nie udało się zapisać korekty.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1100, backgroundColor: "rgba(17, 24, 39, 0.56)" }} onClick={onClose}>
      <section className="card border-0 shadow-lg w-100 p-4" role="dialog" aria-modal="true" aria-labelledby="exit-correction-title" style={{ maxWidth: 620, maxHeight: "92vh", overflowY: "auto" }} onClick={(event) => event.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <span className="small text-uppercase fw-bold text-muted">Korekta historii</span>
            <h2 id="exit-correction-title" className="h4 fw-bold mb-0">{exit.students?.full_name || "Uczeń"}</h2>
          </div>
          <button type="button" className="btn btn-light rounded-circle p-1" aria-label="Zamknij" onClick={onClose} disabled={isSaving}><BsX size={22} /></button>
        </div>

        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

        <form onSubmit={saveCorrection}>
          <label htmlFor="correction-reason" className="form-label fw-semibold">Powód wyjścia</label>
          <input id="correction-reason" className="form-control mb-3" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} />

          <label htmlFor="correction-started-at" className="form-label fw-semibold">Czas wyjścia</label>
          <input id="correction-started-at" type="datetime-local" className="form-control mb-3" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} required />

          <label htmlFor="correction-ended-at" className="form-label fw-semibold">Czas powrotu</label>
          <input id="correction-ended-at" type="datetime-local" className="form-control mb-3" value={endedAt} onChange={(event) => setEndedAt(event.target.value)} required={exit.status === "completed"} />

          <div className="d-flex justify-content-end gap-2 mb-4">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={isSaving}>Anuluj</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz korektę"}</button>
          </div>
        </form>

        <section aria-labelledby="exit-audit-heading">
          <h3 id="exit-audit-heading" className="h6 fw-bold">Historia zmian</h3>
          {isLoadingAudit ? <p className="small text-muted mb-0">Wczytywanie historii...</p> : auditEntries.length ? (
            <ol className="list-unstyled d-flex flex-column gap-2 mb-0">
              {auditEntries.map((entry) => (
                <li className="border rounded-2 p-2 small" key={entry.id}>
                  <div className="d-flex justify-content-between gap-2 mb-1">
                    <strong>{entry.action === "created" ? "Rejestracja" : "Zmiana"} · {entry.changed_by_name}</strong>
                    <time className="text-muted">{new Date(entry.changed_at).toLocaleString("pl-PL")}</time>
                  </div>
                  {entry.old_values && <div className="text-muted">Przed: {describeValues(entry.old_values)}</div>}
                  <div className="text-muted">Po: {describeValues(entry.new_values)}</div>
                </li>
              ))}
            </ol>
          ) : <p className="small text-muted mb-0">Brak zapisanych zmian dla tego wpisu.</p>}
        </section>
      </section>
    </div>
  );
};

export default ExitCorrectionModal;
