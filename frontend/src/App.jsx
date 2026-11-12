import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import AsistenciaPublica from './views/AsistenciaPublica';

function App() {
  // Mock de sesión: al conectar el backend esto pasará a ser un token real
  const [usuario, setUsuario] = useState(null);

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
              <Dashboard usuario={usuario} onLogout={() => setUsuario(null)} />
            ) : (
              <Login onLogin={setUsuario} />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
