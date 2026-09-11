import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap } from 'react-icons/fa';
import { 
  BsList, 
  BsX,
  BsPeopleFill, 
  BsClockHistory, 
  BsCheckCircleFill, 
  BsPlusLg, 
  BsArrowRepeat, 
  BsDownload, 
  BsGear,
  BsChevronDown,
  BsGrid1X2,
  BsDoorOpen,
  BsBarChartLine,
  BsQuestionCircle,
  BsBoxArrowRight,
  BsSearch,
  BsExclamationCircleFill
} from 'react-icons/bs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('3A');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dane oddziałów wyświetlane w lewym panelu.
  const classList = [
    { id: '3A', name: '3A', studentsCount: 32, exitsToday: 24, teacher: 'Jan Nowak' },
    { id: '1A', name: '1A', studentsCount: 28, exitsToday: 12, teacher: 'Anna Maj' },
    { id: '1B', name: '1B', studentsCount: 30, exitsToday: 9, teacher: 'Marek Kowal' },
    { id: '2A', name: '2A', studentsCount: 29, exitsToday: 7, teacher: 'Ewa Wiśniewska' },
    { id: '2C', name: '2C', studentsCount: 27, exitsToday: 8, teacher: 'Karolina Wójcik' },
    { id: '3B', name: '3B', studentsCount: 31, exitsToday: 11, teacher: 'Tomasz Pawlak' },
    { id: '3C', name: '3C', studentsCount: 25, exitsToday: 6, teacher: 'Natalia Król' },
    { id: '2B', name: '2B', studentsCount: 26, exitsToday: 5, teacher: 'Piotr Zieliński' },
  ];

  // Uczniowie przypisani do poszczególnych oddziałów.
  const classStudentsData = {
    '3A': [
      { id: 1, name: 'Jan Kowalski', status: 'Na zewnątrz', lastExit: '11:32 (6 min temu)', avatarBg: '#8b5cf6' },
      { id: 2, name: 'Anna Nowak', status: 'Na zewnątrz', lastExit: '11:28 (10 min temu)', avatarBg: '#3b82f6' },
      { id: 3, name: 'Mateusz Wiśniewski', status: 'Wrócił', lastExit: '11:15', avatarBg: '#10b981' },
      { id: 4, name: 'Zofia Dąbrowska', status: 'Obecna', lastExit: '-', avatarBg: '#6b7280' },
      { id: 5, name: 'Kacper Zieliński', status: 'Wrócił', lastExit: '10:45', avatarBg: '#f59e0b' },
      { id: 6, name: 'Julia Kowalczyk', status: 'Obecna', lastExit: '-', avatarBg: '#ec4899' },
      { id: 7, name: 'Michał Kamiński', status: 'Na zewnątrz', lastExit: '11:35 (3 min temu)', avatarBg: '#6366f1' },
      { id: 8, name: 'Michał Kamiński', status: 'Na zewnątrz', lastExit: '11:35 (3 min temu)', avatarBg: '#6366f1' },
      { id: 9, name: 'Michał Kamiński', status: 'Na zewnątrz', lastExit: '11:35 (3 min temu)', avatarBg: '#6366f1' },
      { id: 10, name: 'Michał Kamiński', status: 'Na zewnątrz', lastExit: '11:35 (3 min temu)', avatarBg: '#6366f1' },
    ],
    '1A': [
      { id: 1, name: 'Piotr Zieliński', status: 'Na zewnątrz', lastExit: '11:40 (2 min temu)', avatarBg: '#8b5cf6' },
      { id: 2, name: 'Katarzyna Lewandowska', status: 'Wrócił', lastExit: '11:05', avatarBg: '#10b981' },
    ],
    '1B': [
      { id: 1, name: 'Tomasz Szymański', status: 'Na zewnątrz', lastExit: '11:36 (5 min temu)', avatarBg: '#3b82f6' },
    ],
    '2A': [
      { id: 1, name: 'Michał Kozłowski', status: 'Na zewnątrz', lastExit: '11:25 (12 min temu)', avatarBg: '#8b5cf6' },
    ],
    '2B': [],
    '2C': [
      { id: 1, name: 'Oliwia Mazur', status: 'Obecna', lastExit: '-', avatarBg: '#ec4899' },
      { id: 2, name: 'Filip Baran', status: 'Na zewnątrz', lastExit: '11:20 (18 min temu)', avatarBg: '#3b82f6' },
    ],
    '3B': [
      { id: 1, name: 'Lena Krupa', status: 'Wrócił', lastExit: '10:55', avatarBg: '#10b981' },
      { id: 2, name: 'Adam Lis', status: 'Na zewnątrz', lastExit: '11:42 (1 min temu)', avatarBg: '#f59e0b' },
      { id: 3, name: 'Maria Zając', status: 'Obecna', lastExit: '-', avatarBg: '#8b5cf6' },
    ],
    '3C': [
      { id: 1, name: 'Igor Wrona', status: 'Na zewnątrz', lastExit: '11:38 (5 min temu)', avatarBg: '#6366f1' },
    ]
  };

  // Historia wyjść filtrowana razem z wybraną klasą.
  const activityHistoryData = {
    '3A': [
      { id: 101, studentName: 'Michał Kamiński', exitTime: '11:35', returnTime: 'w trakcie', duration: '3 min', reason: 'Łazienka', status: 'Na zewnątrz' },
      { id: 102, studentName: 'Jan Kowalski', exitTime: '11:32', returnTime: 'w trakcie', duration: '6 min', reason: 'Łazienka', status: 'Na zewnątrz' },
      { id: 103, studentName: 'Anna Nowak', exitTime: '11:28', returnTime: 'w trakcie', duration: '10 min', reason: 'Pielęgniarka', status: 'Na zewnątrz' },
      { id: 104, studentName: 'Mateusz Wiśniewski', exitTime: '11:10', returnTime: '11:15', duration: '5 min', reason: 'Łazienka', status: 'Zakończone' },
      { id: 105, studentName: 'Kacper Zieliński', exitTime: '10:35', returnTime: '10:45', duration: '10 min', reason: 'Szafka', status: 'Zakończone' },
      { id: 106, studentName: 'Zofia Dąbrowska', exitTime: '09:40', returnTime: '09:58', duration: '18 min', reason: 'Sekretariat', status: 'Przekroczono czas' },
    ],
    '1A': [
      { id: 201, studentName: 'Piotr Zieliński', exitTime: '11:40', returnTime: 'w trakcie', duration: '2 min', reason: 'Łazienka', status: 'Na zewnątrz' },
    ],
    '1B': [],
    '2A': [],
    '2B': [],
    '2C': [
      { id: 301, studentName: 'Filip Baran', exitTime: '11:20', returnTime: 'w trakcie', duration: '18 min', reason: 'Łazienka', status: 'Na zewnątrz' },
    ],
    '3B': [
      { id: 401, studentName: 'Adam Lis', exitTime: '11:42', returnTime: 'w trakcie', duration: '1 min', reason: 'Sekretariat', status: 'Na zewnątrz' },
      { id: 402, studentName: 'Lena Krupa', exitTime: '10:50', returnTime: '10:55', duration: '5 min', reason: 'Szafka', status: 'Zakończone' },
    ],
    '3C': [
      { id: 501, studentName: 'Igor Wrona', exitTime: '11:38', returnTime: 'w trakcie', duration: '5 min', reason: 'Pielęgniarka', status: 'Na zewnątrz' },
    ]
  };

  const currentClassInfo = classList.find(c => c.id === selectedClass) || classList[0];
  const currentStudents = classStudentsData[selectedClass] || [];
  const currentHistory = activityHistoryData[selectedClass] || [];

  const handleLogout = () => navigate('/');

  const renderStatusBadge = (status) => {
    if (status === 'Na zewnątrz') {
      return (
        <span className="badge px-3 py-1.5 rounded-pill fw-semibold" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem' }}>
          Na zewnątrz
        </span>
      );
    }
    if (status === 'Wrócił' || status === 'Zakończone' || status === 'Obecna') {
      return (
        <span className="badge px-3 py-1.5 rounded-pill fw-semibold" style={{ backgroundColor: '#d1fae5', color: '#047857', fontSize: '0.75rem' }}>
          {status === 'Obecna' ? 'Obecna' : status === 'Wrócił' ? 'Wrócił' : 'Zakończone'}
        </span>
      );
    }
    if (status === 'Przekroczono czas') {
      return (
        <span className="badge px-2.5 py-1.5 rounded-pill fw-semibold d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem' }}>
          <BsExclamationCircleFill size={10} /> Przekroczono
        </span>
      );
    }
    return null;
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#ffffff', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Mobilne menu boczne otwierane przyciskiem w górnym pasku. */}
      {isSidebarOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-30" style={{ zIndex: 1040 }} onClick={() => setIsSidebarOpen(false)} />
      )}
      <div 
        className="position-fixed top-0 start-0 h-100 bg-white shadow-lg d-flex flex-column justify-content-between"
        style={{ width: '260px', zIndex: 1050, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease-in-out' }}
      >
        <div>
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex justify-content-center align-items-center rounded-circle text-white" style={{ width: '32px', height: '32px', backgroundColor: '#111827' }}>
                <FaGraduationCap size={16} />
              </div>
              <h6 className="fw-bold mb-0 text-dark">Szkolny Węzeł</h6>
            </div>
            <button className="btn btn-light rounded-circle p-1" onClick={() => setIsSidebarOpen(false)}><BsX size={22} /></button>
          </div>
          <div className="p-3">
            <span className="text-uppercase text-muted fw-bold mb-2 d-block" style={{ fontSize: '0.65rem' }}>MENU GŁÓWNE</span>
            <ul className="nav nav-pills flex-column gap-1">
              <li className="nav-item">
                <a href="#klasy" className="nav-link active d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2" style={{ backgroundColor: '#8b5cf6', fontSize: '0.85rem' }}>
                  <BsGrid1X2 size={16} /> Klasy i uczniowie
                </a>
              </li>
              <li className="nav-item">
                <a href="#wyjscia" className="nav-link text-dark d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2" style={{ fontSize: '0.85rem' }}>
                  <BsDoorOpen size={16} className="text-muted" /> Rejestracja wyjść
                </a>
              </li>
              <li className="nav-item">
                <a href="#statystyki" className="nav-link text-dark d-flex align-items-center gap-2.5 fw-semibold rounded-3 py-2" style={{ fontSize: '0.85rem' }}>
                  <BsBarChartLine size={16} className="text-muted" /> Statystyki i raporty
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="p-3 border-top">
          <a href="#pomoc" className="nav-link text-dark d-flex align-items-center gap-2 fw-semibold rounded-3 mb-2" style={{ fontSize: '0.85rem' }}>
            <BsQuestionCircle size={16} className="text-muted" /> Pomoc
          </a>
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 py-1.5" style={{ fontSize: '0.85rem' }}>
            <BsBoxArrowRight size={16} /> Wyloguj się
          </button>
        </div>
      </div>

      {/* Górny pasek: logo, informacje o użytkowniku i wylogowanie. */}
      <nav className="navbar navbar-expand border-bottom px-4 py-2" style={{ height: '64px', backgroundColor: '#ffffff', borderColor: '#f0f0f0' }}>
        <div className="container-fluid p-0">
          <div className="d-flex align-items-center gap-3">
            <button className="btn border-0 p-1 text-dark me-1" onClick={() => setIsSidebarOpen(true)}>
              <BsList size={26} />
            </button>
            <div className="d-flex align-items-center gap-2.5">
              <div className="d-flex justify-content-center align-items-center rounded-circle text-white" style={{ width: '36px', height: '36px', backgroundColor: '#111827' }}>
                <FaGraduationCap size={18} />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.1' }}>Szkolny Węzeł</h6>
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                  REJESTRACJA WYJŚĆ
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2.5 px-3 py-1.5 rounded-pill" style={{ backgroundColor: '#f5f4f0' }}>
              <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '26px', height: '26px', backgroundColor: '#8b5cf6', fontSize: '0.75rem' }}>
                JN
              </div>
              <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>Jan Nowak <span className="text-muted fw-normal">- Nauczyciel</span></span>
            </div>
            <button onClick={handleLogout} className="btn btn-light fw-semibold rounded-pill px-3 py-1.5" style={{ fontSize: '0.82rem', backgroundColor: '#f5f4f0', color: '#111827', border: '1px solid #e5e2d9' }}>
              Wyloguj się
            </button>
          </div>
        </div>
      </nav>

      {/* Główna przestrzeń dashboardu ograniczona do wysokości okna. */}
      <div className="container-fluid px-4 py-4" style={{ height: 'calc(100vh - 104px)', flex: '0 0 auto', minHeight: 0, overflow: 'hidden' }}>
        <div className="row g-4 h-100" style={{ minHeight: 0 }}>
          
          {/* Lewy panel: oddziały, przewijana lista klas i stały przycisk dodawania. */}
          <div className="col-12 col-xl-3 col-lg-4" style={{ minHeight: 0 }}>
            <div className="card border-0 p-4 h-100 d-flex flex-column" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f8f7f2', borderRadius: '28px', border: '1px solid #eae7e0' }}>
              <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ paddingBottom: '64px' }}>
                <h5 className="fw-bold mb-1" style={{ color: '#111827', fontSize: '1.15rem' }}>Oddziały szkolne</h5>
                <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                  Wybierz klasę, aby przejrzeć listę i logi wyjść.
                </p>

                <button className="btn w-100 d-flex justify-content-between align-items-center mb-3 px-3 py-2 bg-white" style={{ border: '1px solid #e5e2d9', borderRadius: '16px', fontSize: '0.85rem' }}>
                  <span>Wszystkie klasy</span>
                  <BsChevronDown size={12} />
                </button>

                {/* Lista klas przewijana niezależnie od reszty panelu. */}
                <div className="d-flex flex-column gap-2 pe-1" style={{ height: 'calc(100vh - 420px)', minHeight: '180px', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', flex: '0 0 auto' }}>
                  {classList.map((cls) => {
                    const isActive = selectedClass === cls.id;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => setSelectedClass(cls.id)}
                        className="p-3 transition-all"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#ffffff' : '#f0eee6',
                          border: isActive ? '2px solid #8b5cf6' : '1px solid #e5e2d9',
                          borderRadius: '18px',
                          boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.08)' : 'none'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h5 className="fw-bold mb-0" style={{ color: '#111827', fontSize: '1.05rem' }}>Klasa {cls.name}</h5>
                          {isActive && (
                            <div className="d-flex justify-content-center align-items-center" style={{ width: '28px', height: '28px', backgroundColor: '#f3e8ff', color: '#8b5cf6', borderRadius: '10px' }}>
                              <BsPeopleFill size={13} />
                            </div>
                          )}
                        </div>
                        <div className="fw-semibold text-dark mb-1" style={{ fontSize: '0.82rem' }}>
                          {cls.studentsCount} uczniów
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          • Dzisiaj: <strong className="text-dark">{cls.exitsToday} wyjść</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4" style={{ position: 'absolute', right: '24px', bottom: '16px', left: '24px', zIndex: 2 }}>
                <button className="btn w-100 fw-semibold text-white py-2.5" style={{ backgroundColor: '#8b5cf6', borderRadius: '16px', fontSize: '0.85rem' }}>
                  <BsPlusLg className="me-1.5" /> Dodaj nową klasę
                </button>
              </div>
            </div>
          </div>

          {/* Prawa część dashboardu z podsumowaniem i rejestrami. */}
          <div className="col-12 col-xl-9 col-lg-8 d-flex flex-column gap-4" style={{ minHeight: 0, overflow: 'hidden' }}>
            
            {/* Nagłówek wybranej klasy oraz akcje zarządzania. */}
            <div className="card border-0 p-4 shadow-sm flex-shrink-0" style={{ backgroundColor: '#f8f7f2', borderRadius: '28px', border: '1px solid #eae7e0' }}>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="fw-bold mb-0" style={{ color: '#111827', fontSize: '1.6rem' }}>Klasa {currentClassInfo.name}</h3>
                    <span className="badge px-2.5 py-1 rounded-pill" style={{ backgroundColor: '#e9d5ff', color: '#6b21a8', fontSize: '0.75rem' }}>Wychowawca: {currentClassInfo.teacher}</span>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Podsumowanie bieżących statystyk i obecności dla wybranej klasy.</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="btn bg-white fw-semibold px-3 py-2 d-flex align-items-center gap-1.5" style={{ border: '1px solid #e5e2d9', borderRadius: '14px', fontSize: '0.82rem' }}>
                    <BsDownload size={13} /> Eksport
                  </button>
                  <button className="btn text-white fw-semibold px-3.5 py-2 d-flex align-items-center gap-1.5" style={{ backgroundColor: '#8b5cf6', borderRadius: '14px', fontSize: '0.82rem' }}>
                    <BsArrowRepeat size={14} /> Synchronizuj
                  </button>
                  <button className="btn bg-white fw-semibold px-3 py-2 d-flex align-items-center gap-1.5" style={{ border: '1px solid #e5e2d9', borderRadius: '14px', fontSize: '0.82rem' }}>
                    <BsGear size={13} /> Zarządzaj
                  </button>
                </div>
              </div>

              {/* Trzy karty statystyk; na wąskich ekranach przewijają się poziomo. */}
              <div className="row flex-nowrap g-3 pt-2 overflow-auto">
                <div className="col-10 col-md-4">
                  <div className="bg-white p-3 d-flex align-items-center justify-content-between h-100" style={{ borderRadius: 0, border: '1px solid #eae7e0' }}>
                    <div>
                      <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '0.65rem' }}>Uczniowie</span>
                      <h4 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>{currentClassInfo.studentsCount}</h4>
                    </div>
                    <div className="p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6', borderRadius: '14px', width: '42px', height: '42px' }}>
                      <BsPeopleFill size={18} />
                    </div>
                  </div>
                </div>

                <div className="col-10 col-md-4">
                  <div className="bg-white p-3 d-flex align-items-center justify-content-between h-100" style={{ borderRadius: 0, border: '1px solid #eae7e0' }}>
                    <div>
                      <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '0.65rem' }}>Aktywne wyjścia</span>
                      <h4 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>{currentStudents.filter(s => s.status === 'Na zewnątrz').length}</h4>
                    </div>
                    <div className="p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '14px', width: '42px', height: '42px' }}>
                      <BsClockHistory size={18} />
                    </div>
                  </div>
                </div>

                <div className="col-10 col-md-4">
                  <div className="bg-white p-3 d-flex align-items-center justify-content-between h-100" style={{ borderRadius: 0, border: '1px solid #eae7e0' }}>
                    <div>
                      <span className="text-uppercase fw-bold text-muted d-block mb-1" style={{ fontSize: '0.65rem' }}>Frekwencja</span>
                      <h4 className="fw-bold mb-0" style={{ fontSize: '1.4rem' }}>98.1%</h4>
                    </div>
                    <div className="p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#d1fae5', color: '#059669', borderRadius: '14px', width: '42px', height: '42px' }}>
                      <BsCheckCircleFill size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dolne panele mają własne wysokości i niezależne przewijanie. */}
            <div className="row g-4" style={{ height: 'calc(100vh - 390px)', marginBottom: '24px', flex: '0 0 auto', minHeight: 0, overflow: 'visible' }}>
              
              {/* Lista uczniów wybranej klasy. */}
              <div className="col-12 col-xl-6 h-100" style={{ minHeight: 0 }}>
                <div className="card border-0 p-4 shadow-sm h-100 d-flex flex-column" style={{ minHeight: 0, overflow: 'hidden', backgroundColor: '#f8f7f2', borderRadius: '28px', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', backgroundClip: 'padding-box', border: '1px solid #eae7e0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0" style={{ color: '#111827', fontSize: '1.1rem' }}>Lista uczniów ({currentStudents.length})</h5>
                    <button className="btn bg-white border-0 fw-semibold shadow-sm px-3 py-1.5" style={{ fontSize: '0.78rem', borderRadius: '12px', border: '1px solid #e5e2d9' }}>
                      Odśwież
                    </button>
                  </div>

                  {/* Lista przewijana wewnątrz karty, bez rozciągania strony. */}
                  <div className="d-flex flex-column gap-2" style={{ minHeight: 0, height: 0, padding: '4px 8px 12px 4px', overflowY: 'scroll', flex: '1 1 0%' }}>
                    {currentStudents.map((student) => (
                      <div 
                        key={student.id} 
                        className="d-flex align-items-center justify-content-between p-3 bg-white"
                        style={{ borderRadius: '16px', border: '1px solid #eae7e0' }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
                            style={{ width: '36px', height: '36px', backgroundColor: student.avatarBg, fontSize: '0.8rem' }}
                          >
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block" style={{ fontSize: '0.88rem' }}>{student.name}</span>
                            <span className="text-muted" style={{ fontSize: '0.73rem' }}>Ostatnie wyjście: {student.lastExit}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {renderStatusBadge(student.status)}
                          <button className="btn bg-light border-0 fw-semibold px-2.5 py-1" style={{ fontSize: '0.75rem', borderRadius: '10px', color: '#374151' }}>
                            Logi
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Historia wyjść z wyszukiwaniem i statusami. */}
              <div className="col-12 col-xl-6 h-100" style={{ minHeight: 0 }}>
                <div className="card border-0 p-4 shadow-sm h-100 d-flex flex-column" style={{ minHeight: 0, overflow: 'hidden', backgroundColor: '#f8f7f2', borderRadius: '28px', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', backgroundClip: 'padding-box', border: '1px solid #eae7e0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0" style={{ color: '#111827', fontSize: '1.1rem' }}>Historia wyjść dzisiaj</h5>
                    <div className="position-relative">
                      <BsSearch size={12} className="position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted" />
                      <input 
                        type="text" 
                        placeholder="Szukaj..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-control bg-white border-0 shadow-sm ps-4 py-1.5"
                        style={{ borderRadius: '12px', fontSize: '0.78rem', width: '130px', border: '1px solid #e5e2d9' }}
                      />
                    </div>
                  </div>

                  {/* Wpisy historii przewijane niezależnie od listy uczniów. */}
                  <div className="d-flex flex-column gap-2" style={{ minHeight: 0, height: 0, padding: '4px 8px 12px 4px', overflowY: 'scroll', flex: '1 1 0%' }}>
                    {currentHistory.length > 0 ? (
                      currentHistory.map((log) => (
                        <div 
                          key={log.id} 
                          className="d-flex align-items-center justify-content-between p-3 bg-white"
                          style={{ borderRadius: '16px', border: '1px solid #eae7e0' }}
                        >
                          <div>
                            <span className="fw-bold text-dark d-block" style={{ fontSize: '0.88rem' }}>{log.studentName}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              Wyjście: <strong className="text-dark">{log.exitTime}</strong> ({log.duration})
                            </span>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span className="badge px-2.5 py-1" style={{ backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '500' }}>
                              {log.reason}
                            </span>
                            {renderStatusBadge(log.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted p-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #eae7e0', fontSize: '0.85rem' }}>
                        Brak wyjść zarejestrowanych dzisiaj.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Stopka aplikacji. */}
      <footer className="text-center py-3 mt-auto border-top" style={{ borderColor: '#f0f0f0', backgroundColor: '#ffffff' }}>
        <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
          Szkolny Węzeł © 2024. Ogólnopolski system zarządzania placówką.
        </p>
      </footer>

    </div>
  );
};

export default Dashboard;