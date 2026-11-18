import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import PadreView from './views/PadreView';
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

        {/* Paneles privados: staff → dashboard, padre → portal propio */}
        <Route
          path="*"
          element={
            !usuario ? (
              <Login onLogin={handleLogin} />
            ) : usuario.rol === 'padre' ? (
              <PadreView usuario={usuario} onLogout={handleLogout} />
            ) : (
              <Dashboard usuario={usuario} onLogout={handleLogout} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
