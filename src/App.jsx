import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginScreen from './LoginScreen.jsx';
import Dashboard from './Dashboard.jsx';
import ResetPassword from './ResetPassword.jsx';
import UpdatePassword from './UpdatePassword.jsx';

// Przykładowy komponent widoku po zalogowaniu
// const Dashboard = () => (
//   <div className="container mt-5">
//     <h2>Witaj w panelu głównym!</h2>
//   </div>
// );

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/reset-hasla" element={<ResetPassword />} />
        <Route path="/ustaw-nowe-haslo" element={<UpdatePassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
