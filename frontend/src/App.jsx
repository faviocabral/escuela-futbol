import React, { useState } from 'react';
import Login from './views/Login';
import Dashboard from './views/Dashboard';

function App() {
  // Mock de sesión: al conectar el backend esto pasará a ser un token real
  const [usuario, setUsuario] = useState(null);

  return usuario ? (
    <Dashboard usuario={usuario} onLogout={() => setUsuario(null)} />
  ) : (
    <Login onLogin={setUsuario} />
  );
}

export default App;
