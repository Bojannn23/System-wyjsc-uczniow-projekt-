import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap } from 'react-icons/fa';
import { BsDisplay, BsPeople, BsEnvelope, BsKey } from 'react-icons/bs';
import { SlBadge } from 'react-icons/sl';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';

const LoginScreen = () => {
  const [activeRole, setActiveRole] = useState('Nauczyciel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const roles = [
    { id: 'Nauczyciel', icon: <BsDisplay size={28} className="mb-2" />, bgColor: '#8b5cf6' },
    { id: 'Dyrektor', icon: <SlBadge size={28} className="mb-2" />, bgColor: '#10b981' },
    { id: 'Pedagog', icon: <BsPeople size={28} className="mb-2" />, bgColor: '#3b82f6' },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isSupabaseConfigured) return setError('Brak połączenia z bazą. Uzupełnij konfigurację Supabase w pliku .env.');
    setIsSubmitting(true);
    const client = getSupabase();
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      const loginMessages = {
        'Email not confirmed': 'Adres e-mail tego konta nie został jeszcze potwierdzony w Supabase.',
        'Invalid login credentials': 'Supabase odrzucił dane logowania. Sprawdź e-mail i hasło użytkownika utworzonego w Authentication → Users.',
      };
      return setError(loginMessages[signInError.message] || `Supabase: ${signInError.message}`);
    }
    const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', signInData.user.id).single();
    const expectedRole = { Nauczyciel: 'nauczyciel', Dyrektor: 'dyrektor', Pedagog: 'pedagog' }[activeRole];
    if (profileError || profile.role !== expectedRole) {
      await client.auth.signOut();
      return setError('Wybrana rola nie odpowiada roli przypisanej do tego konta.');
    }
    navigate('/dashboard');
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f5f4ef', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4"><div className="d-inline-flex justify-content-center align-items-center rounded-3 mb-3" style={{ width: '48px', height: '48px', backgroundColor: '#3b3835', color: '#fff' }}><FaGraduationCap size={24} /></div><h6 className="text-muted fw-semibold mb-1">Szkolny Węzeł</h6><h1 className="h2 fw-bold mb-3" style={{ color: '#2b2927' }}>Zaloguj się</h1><p className="text-muted small">Wybierz swoją rolę w systemie, aby kontynuować</p></div>
        <div className="d-flex justify-content-between gap-3 mb-4">{roles.map((role) => <button key={role.id} type="button" onClick={() => setActiveRole(role.id)} className="btn flex-fill d-flex flex-column align-items-center justify-content-center p-3 rounded-4 border-0 text-white" style={{ backgroundColor: role.bgColor, outline: activeRole === role.id ? '3px solid #2b2927' : 'none', height: '110px' }}>{role.icon}<span className="small fw-semibold">{role.id}</span></button>)}</div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger small py-2" role="alert">{error}</div>}
          <div className="mb-4"><label htmlFor="login-email" className="form-label text-uppercase small fw-bold mb-2">Adres e-mail</label><div className="input-group"><span className="input-group-text bg-white border-end-0 text-muted px-3"><BsEnvelope size={18} /></span><input id="login-email" type="email" className="form-control border-start-0 ps-1 py-2 shadow-none" placeholder="j.nowak@szkolnywezel.pl" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div></div>
          <div className="mb-4"><label htmlFor="login-password" className="form-label text-uppercase small fw-bold mb-2">Hasło</label><div className="input-group"><span className="input-group-text bg-white border-end-0 text-muted px-3"><BsKey size={18} /></span><input id="login-password" type="password" className="form-control border-start-0 ps-1 py-2 shadow-none" placeholder="••••••••••••" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></div>
          <button type="submit" disabled={isSubmitting} className="btn w-100 py-3 mb-3 fw-semibold text-white rounded-3 shadow-sm" style={{ backgroundColor: '#332f2c' }}>{isSubmitting ? 'Logowanie…' : 'Wejdź do systemu'}</button>
        </form>
        <Link to="/reset-hasla" state={{ email }} className="text-decoration-underline small fw-semibold" style={{ color: '#8b5cf6' }}>Zapomniałeś hasła?</Link>
      </div>
      <div className="text-center mt-5 small text-muted"><p className="mb-1">Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.</p><p>Potrzebujesz pomocy? Skontaktuj się z administratorem swojej szkoły.</p></div>
    </div>
  );
};

export default LoginScreen;
