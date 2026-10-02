import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';
import ReportPage from '../features/reports/pages/ReportPage.jsx';
import DirectorManagementPage from '../features/dashboard/pages/DirectorManagementPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/raport" element={<ReportPage />} />
        <Route path="/zarzadzanie" element={<DirectorManagementPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
