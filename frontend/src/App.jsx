import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import PadreView from './views/PadreView';
import { setToken, setOnSesionExpirada } from './api';

function App() {
  // Sesión persistida en localStorage (token + datos del usuario)
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });
  const [sesionExpirada, setSesionExpirada] = useState(false);

  // Si cualquier llamada a la API devuelve 401 → cerrar sesión y volver al login
  useEffect(() => {
    setOnSesionExpirada(() => {
      localStorage.removeItem('usuario');
      setToken(null);
      setUsuario(null);
      setSesionExpirada(true);
    });
    return () => setOnSesionExpirada(null);
  }, []);

  const handleLogin = (u) => {
    localStorage.setItem('usuario', JSON.stringify(u));
    setSesionExpirada(false);
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
        {/* Paneles privados: staff → dashboard, padre → portal propio */}
        <Route
          path="*"
          element={
            !usuario ? (
              <Login onLogin={handleLogin} sesionExpirada={sesionExpirada} />
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
