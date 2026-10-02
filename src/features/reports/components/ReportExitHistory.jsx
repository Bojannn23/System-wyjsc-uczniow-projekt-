import React, { useMemo, useState } from "react";
import { BsPencilSquare, BsSearch } from "react-icons/bs";

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })
  : "-";

const ReportExitHistory = ({ exits, canCorrect, onCorrect }) => {
  const [query, setQuery] = useState("");
  const filteredExits = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pl-PL");
    if (!normalizedQuery) return exits;

    return exits.filter((exit) => [
      exit.students?.full_name,
      exit.reason,
      exit.status,
    ].some((value) => value?.toLocaleLowerCase("pl-PL").includes(normalizedQuery)));
  }, [exits, query]);

  return (
    <section className="report-history-section mt-4" aria-labelledby="report-history-heading">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
        <div>
          <h2 id="report-history-heading" className="h5 fw-bold mb-1">Historia wyjść</h2>
          <span className="small text-muted">{filteredExits.length} z {exits.length} wpisów</span>
        </div>
        <div className="position-relative" style={{ width: "100%", maxWidth: 280 }}>
          <BsSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" aria-hidden="true" />
          <input
            type="search"
            className="form-control bg-white ps-5"
            placeholder="Szukaj ucznia, powodu lub statusu"
            aria-label="Filtruj historię wyjść"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Uczeń</th>
              <th scope="col">Powód</th>
              <th scope="col">Wyjście</th>
              <th scope="col">Powrót</th>
              <th scope="col">Status</th>
              {canCorrect && <th scope="col" className="text-end">Korekta</th>}
            </tr>
          </thead>
          <tbody>
            {filteredExits.map((exit) => (
              <tr key={exit.id}>
                <td className="fw-semibold">{exit.students?.full_name || "Uczeń"}</td>
                <td>{exit.reason || "Brak powodu"}</td>
                <td>{formatDateTime(exit.started_at)}</td>
                <td>{formatDateTime(exit.ended_at)}</td>
                <td>{exit.status === "active" ? "Aktywne" : exit.status === "cancelled" ? "Anulowane" : "Zakończone"}</td>
                {canCorrect && (
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onCorrect(exit)}
                      aria-label={`Koryguj wpis ucznia ${exit.students?.full_name || "Uczeń"}`}
                    >
                      <BsPencilSquare className="me-1" aria-hidden="true" /> Korekta
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!filteredExits.length && (
              <tr>
                <td className="text-center text-muted py-4" colSpan={canCorrect ? 6 : 5}>
                  {exits.length ? "Nie znaleziono pasujących wpisów." : "Brak wyjść w wybranym okresie."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportExitHistory;
