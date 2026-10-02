import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap } from 'react-icons/fa';
import { supabase, hasSupabase } from '../../../shared/lib/supabase.js';
import LoginForm from '../components/LoginForm.jsx';
import RoleSelector from '../components/RoleSelector.jsx';

const LoginPage = () => {
  const [activeRole, setActiveRole] = useState('Nauczyciel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasSupabase || !supabase) {
      setError('Brak konfiguracji Supabase. Uzupełnij plik .env.');
      return;
    }

    setIsSubmitting(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Nieprawidłowy adres e-mail lub hasło.');
      setIsSubmitting(false);
      return;
    }

    const { data: staffMember, error: staffError } = await supabase
      .from('staff')
      .select('id, roles:role_id (name)')
      .eq('email', data.user.email)
      .maybeSingle();

    if (staffError || !staffMember) {
      await supabase.auth.signOut();
      setError('To konto nie ma przypisanego pracownika w bazie.');
      setIsSubmitting(false);
      return;
    }

    const roleMap = {
      Nauczyciel: 'nauczyciel',
      Dyrektor: 'dyrektor',
      Pedagog: 'pedagog',
    };

    if (staffMember.roles?.name !== roleMap[activeRole]) {
      await supabase.auth.signOut();
      setError('Wybrana rola nie jest przypisana do tego konta.');
      setIsSubmitting(false);
      return;
    }

    navigate('/dashboard');
    setIsSubmitting(false);
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f5f4ef', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex justify-content-center align-items-center rounded-3 mb-3" style={{ width: '48px', height: '48px', backgroundColor: '#3b3835', color: '#fff' }}>
            <FaGraduationCap size={24} />
          </div>
          <h6 className="text-muted fw-semibold mb-1">Szkolny Węzeł</h6>
          <h1 className="h2 fw-bold mb-3" style={{ color: '#2b2927' }}>Zaloguj się</h1>
          <p className="text-muted small">Wybierz swoją rolę w systemie, aby kontynuować</p>
        </div>

        <RoleSelector value={activeRole} onChange={setActiveRole} />
        <LoginForm
          email={email}
          password={password}
          error={error}
          isSubmitting={isSubmitting}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>

      <footer className="text-center mt-5 small text-muted" style={{ fontSize: '0.8rem' }}>
        <p className="mb-1">Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.</p>
        <p>Potrzebujesz pomocy? Skontaktuj się z administratorem swojej szkoły.</p>
      </footer>
    </div>
  );
};

export default LoginPage;