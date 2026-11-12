import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ESTAS LÍNEAS IMPORTAN LOS ESTILOS DIRECTAMENTE A TU BUNDLE DE REACT
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';


// 1. Cargamos los iconos universales
import 'bootstrap-icons/font/bootstrap-icons.css';
// 2. Cargamos el core completo de estilos de AdminLTE 4 (Ya incluye Bootstrap 5 internamente)
import 'admin-lte/dist/css/adminlte.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
