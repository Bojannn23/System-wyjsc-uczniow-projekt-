import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsCheckCircleFill, BsKey } from 'react-icons/bs';
import { FaGraduationCap } from 'react-icons/fa';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';
import './ResetPassword.css';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isUpdated, setIsUpdated] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError('Hasło musi mieć co najmniej 8 znaków.');
    if (password !== confirmation) return setError('Wpisane hasła nie są takie same.');
    if (!isSupabaseConfigured) return setError('Brak połączenia z bazą. Uzupełnij konfigurację Supabase w pliku .env.');
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    if (updateError) return setError('Link jest nieprawidłowy albo wygasł. Poproś o nowy link resetujący.');
    setIsUpdated(true);
  };

  return <main className="reset-page d-flex justify-content-center align-items-center min-vh-100 px-3"><section className="reset-card card border-0 shadow-lg rounded-4"><div className="card-body p-4 p-md-5"><header className="text-center mb-4"><div className="reset-logo d-inline-flex justify-content-center align-items-center rounded-3 mb-3"><FaGraduationCap size={24} /></div><h1 className="h2 fw-bold">Ustaw nowe hasło</h1><p className="text-muted small">Wybierz silne hasło, którego nie używasz w innych serwisach.</p></header>{isUpdated ? <div className="reset-success text-center" role="status"><BsCheckCircleFill size={42} /><h2 className="h4 fw-bold mt-3">Hasło zostało zmienione</h2><button type="button" className="btn reset-primary w-100 py-3 fw-semibold mt-2" onClick={() => navigate('/')}>Przejdź do logowania</button></div> : <form onSubmit={handleSubmit}>{error && <div className="alert alert-danger small py-2" role="alert">{error}</div>}<label htmlFor="new-password" className="form-label text-uppercase small fw-bold reset-label">Nowe hasło</label><div className="input-group mb-3"><span className="input-group-text bg-white border-end-0 text-muted px-3"><BsKey /></span><input id="new-password" className="form-control border-start-0 ps-1 py-2 shadow-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div><label htmlFor="password-confirmation" className="form-label text-uppercase small fw-bold reset-label">Powtórz nowe hasło</label><div className="input-group mb-4"><span className="input-group-text bg-white border-end-0 text-muted px-3"><BsKey /></span><input id="password-confirmation" className="form-control border-start-0 ps-1 py-2 shadow-none" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></div><button type="submit" className="btn reset-primary w-100 py-3 fw-semibold">Zapisz nowe hasło</button></form>}<Link to="/" className="reset-back-link d-inline-flex align-items-center gap-2 small fw-semibold mt-4">Wróć do logowania</Link></div></section></main>;
};

export default UpdatePassword;
