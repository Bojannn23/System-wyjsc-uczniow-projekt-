import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Dodano import useNavigate
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap } from 'react-icons/fa';
import { BsDisplay, BsPeople, BsEnvelope, BsKey } from 'react-icons/bs';
import { SlBadge } from 'react-icons/sl'; // Ikona dla Dyrektora

const LoginScreen = () => {
  const [activeRole, setActiveRole] = useState('Nauczyciel');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate(); // 2. Inicjalizacja nawigacji

  const roles = [
    { id: 'Nauczyciel', label: 'Nauczyciel', icon: <BsDisplay size={28} className="mb-2" />, bgColor: '#8b5cf6' },
    { id: 'Dyrektor', label: 'Dyrektor', icon: <SlBadge size={28} className="mb-2" />, bgColor: '#10b981' },
    { id: 'Pedagog', label: 'Pedagog', icon: <BsPeople size={28} className="mb-2" />, bgColor: '#3b82f6' },
  ];

  // 3. Obsługa wysłania formularza i przekierowania
  const handleSubmit = (e) => {
    e.preventDefault();

    // Tutaj możesz dodać walidację lub zapytanie do API
    console.log('Zalogowano jako:', activeRole, email);

    // Przekierowanie użytkownika na podaną ścieżkę (np. /panel lub /dashboard)
    navigate('/dashboard');
  };

  // const handleReset = (e) => {
  //   e.preventDefault();
  //   setEmail('');
  //   setPassword('');
  // };

  return (
    <div 
      className="d-flex flex-column justify-content-center align-items-center min-vh-100" 
      style={{ backgroundColor: '#f5f4ef', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Główna Karta Logowania */}
      <div 
        className="card shadow-lg border-0 rounded-4 p-4 p-md-5" 
        style={{ maxWidth: '480px', width: '100%' }}
      >
        {/* Nagłówek */}
        <div className="text-center mb-4">
          <div 
            className="d-inline-flex justify-content-center align-items-center rounded-3 mb-3" 
            style={{ width: '48px', height: '48px', backgroundColor: '#3b3835', color: '#fff' }}
          >
            <FaGraduationCap size={24} />
          </div>
          <h6 className="text-muted fw-semibold mb-1">Szkolny Węzeł</h6>
          <h2 className="fw-bold mb-3" style={{ color: '#2b2927' }}>Zaloguj się</h2>
          <p className="text-muted small">Wybierz swoją rolę w systemie, aby kontynuować</p>
        </div>

        {/* Wybór Roli */}
        <div className="d-flex justify-content-between gap-3 mb-4">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button" // Ważne: dodano type="button", aby kliknięcie roli nie wysyłało formularza
              onClick={() => setActiveRole(role.id)}
              className="btn flex-fill d-flex flex-column align-items-center justify-content-center p-3 rounded-4 border-0 text-white transition"
              style={{
                backgroundColor: role.bgColor,
                border: activeRole === role.id ? '10px solid black' : '3px solid black',
                height: activeRole === role.id ? '115px' : '110px',
                width: activeRole === role.id ? '115px' : '110px',
              }}
            >
              {role.icon}
              <span className="small fw-semibold">{role.label}</span>
            </button>
          ))}
        </div>

        {/* Formularz - 4. Dodano onSubmit={handleSubmit} */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="form-label text-uppercase small fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              Adres E-mail
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}>
                <BsEnvelope size={18} />
              </span>
              <input 
                type="email" 
                className="form-control border-start-0 ps-1 py-2 shadow-none" 
                placeholder="j.nowak@szkolnywezel.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', borderColor: '#dee2e6' }}
              />
            </div>
          </div>

          {/* Hasło */}
          <div className="mb-4">
            <label className="form-label text-uppercase small fw-bold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              Hasło
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}>
                <BsKey size={18} />
              </span>
              <input 
                type="password" 
                className="form-control border-start-0 ps-1 py-2 shadow-none" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem', borderColor: '#dee2e6' }}
              />
            </div>
          </div>

          {/* Przycisk Logowania */}
          <button 
            type="submit" 
            className="btn w-100 py-3 mb-3 fw-semibold text-white rounded-3 shadow-sm"
            style={{ backgroundColor: '#332f2c' }}
          >
            Wejdź do systemu
          </button>
        </form>

        {/* Linki na dole formularza */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <a href="#" className="text-decoration-underline small fw-semibold" style={{ color: '#8b5cf6' }}>
            Zapomniałeś hasła?
          </a>
          {/* <button 
            onClick={handleReset} 
            className="btn btn-sm px-3 py-1 fw-semibold text-muted" 
            style={{ backgroundColor: '#f4f2ef', borderRadius: '0.5rem', fontSize: '0.8rem' }}
          >
            Resetuj formularz
          </button> */}
        </div>
      </div>

      {/* Stopka na dole strony */}
      <div className="text-center mt-5 small text-muted" style={{ fontSize: '0.8rem' }}>
        <p className="mb-1">Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.</p>
        <p>Potrzebujesz pomocy? Skontaktuj się z administratorem swojej szkoły.</p>
      </div>
    </div>
  );
};

export default LoginScreen;