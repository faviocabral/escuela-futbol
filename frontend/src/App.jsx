import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import AsistenciaPublica from './views/AsistenciaPublica';
import { setToken } from './api';

function App() {
  // Sesión persistida en localStorage (token + datos del usuario)
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });

  const handleLogin = (u) => {
    localStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {/* Pantalla pública para padres — sin login */}
        <Route path="/asistencia" element={<AsistenciaPublica />} />

        {/* Panel privado */}
        <Route
          path="*"
          element={
            usuario ? (
              <Dashboard usuario={usuario} onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
