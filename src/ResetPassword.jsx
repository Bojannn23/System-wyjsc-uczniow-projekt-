import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap } from 'react-icons/fa';
import { BsArrowLeft, BsCheckCircleFill, BsEnvelope, BsKey, BsShieldCheck } from 'react-icons/bs';
import './ResetPassword.css';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';

const ResetPassword = () => {
  const location = useLocation();
  const [method, setMethod] = useState('standard');
  const [email, setEmail] = useState(location.state?.email || '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    if (!isSupabaseConfigured) {
      setError('Brak połączenia z bazą. Uzupełnij konfigurację Supabase w pliku .env.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/ustaw-nowe-haslo`,
    });
    setIsSubmitting(false);
    if (resetError) {
      const resetMessages = {
        'Email rate limit exceeded': 'Limit wysyłki e-maili został chwilowo przekroczony. Odczekaj minutę i spróbuj ponownie.',
        'Email rate limit exceeded. Please try again later.': 'Limit wysyłki e-maili został chwilowo przekroczony. Odczekaj minutę i spróbuj ponownie.',
      };
      setError(resetMessages[resetError.message] || `Supabase: ${resetError.message}`);
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <main className="reset-page d-flex flex-column justify-content-center align-items-center min-vh-100 px-3">
      <section className="reset-card card border-0 shadow-lg rounded-4" aria-labelledby="reset-title">
        <div className="card-body p-4 p-md-5">
          <Link to="/" className="reset-back-link d-inline-flex align-items-center gap-2 small fw-semibold mb-4">
            <BsArrowLeft aria-hidden="true" /> Wróć do logowania
          </Link>

          <header className="text-center mb-4">
            <div className="reset-logo d-inline-flex justify-content-center align-items-center rounded-3 mb-3">
              <FaGraduationCap size={24} aria-hidden="true" />
            </div>
            <p className="text-muted fw-semibold mb-1">Szkolny Węzeł</p>
            <h1 id="reset-title" className="h2 fw-bold mb-2">Zresetuj hasło</h1>
            <p className="text-muted small mb-0">Wybierz bezpieczny sposób odzyskania dostępu do konta.</p>
          </header>

          {isSubmitted ? (
            <div className="reset-success text-center" role="status">
              <BsCheckCircleFill size={42} aria-hidden="true" />
              <h2 className="h4 fw-bold mt-3">Sprawdź swoją skrzynkę</h2>
              <p className="text-muted mb-4">
                Jeżeli konto jest przypisane do adresu <strong>{email}</strong>, wysłaliśmy instrukcję zmiany hasła.
              </p>
              <button type="button" className="btn reset-primary w-100 py-3 fw-semibold" onClick={() => setIsSubmitted(false)}>
                Wybierz inną metodę
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger small py-2" role="alert">{error}</div>}
              <div className="reset-methods mb-4" role="radiogroup" aria-label="Metoda resetowania hasła">
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === 'standard'}
                  className={`reset-method text-start ${method === 'standard' ? 'is-selected' : ''}`}
                  onClick={() => setMethod('standard')}
                >
                  <span className="reset-method-icon"><BsKey aria-hidden="true" /></span>
                  <span><strong>Standardowy reset</strong><small>Wyślemy bezpieczny link na adres konta.</small></span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === 'gmail'}
                  className={`reset-method text-start ${method === 'gmail' ? 'is-selected' : ''}`}
                  onClick={() => setMethod('gmail')}
                >
                  <span className="reset-method-icon gmail-icon"><BsEnvelope aria-hidden="true" /></span>
                  <span><strong>Reset przez Gmail</strong><small>Użyj Gmaila wpisanego wcześniej podczas logowania.</small></span>
                </button>
              </div>

              <div className="mb-3">
                <label htmlFor="reset-email" className="form-label text-uppercase small fw-bold reset-label">
                  {method === 'gmail' ? 'Adres Gmail' : 'Adres e-mail konta'}
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted px-3"><BsEnvelope aria-hidden="true" /></span>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-control border-start-0 ps-1 py-2 shadow-none"
                    placeholder="j.nowak@gmail.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn reset-primary w-100 py-3 fw-semibold">
                {isSubmitting ? 'Wysyłanie…' : method === 'gmail' ? 'Wyślij link na Gmail' : 'Wyślij link resetujący'}
              </button>
            </form>
          )}

          <aside className="reset-security-note d-flex gap-3 mt-4" aria-label="Informacja bezpieczeństwa">
            <BsShieldCheck size={20} aria-hidden="true" />
            <p className="small mb-0">Dla bezpieczeństwa link jest jednorazowy i wygasa po 30 minutach.</p>
          </aside>
        </div>
      </section>
      <p className="text-center mt-4 small text-muted">Potrzebujesz pomocy? Skontaktuj się z administratorem swojej szkoły.</p>
    </main>
  );
};

export default ResetPassword;
