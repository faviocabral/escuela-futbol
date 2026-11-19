import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { JugadoresView } from './JugadoresView';
import { EntrenadoresView } from './EntrenadoresView';
import { CategoriasView } from './CategoriasView';
import { TorneosView } from './TorneosView';
import { AsistenciaView } from './AsistenciaView';
import { PagosView } from './PagosView';
import { CalendarioView } from './CalendarioView';
import { ConfiguracionView } from './ConfiguracionView';
import {
  useStore, useCargando, cargarDatos,
  crearEn, actualizarEn, eliminarEn,
  guardarConvocatoria, guardarAsistencia, confirmarAsistencia, cambiarEstadoPago,
} from '../store';
import { aviso } from '../utils/notify';

const TITULOS = {
  jugadores: 'Jugadores',
  entrenadores: 'Entrenadores',
  categorias: 'Categorías',
  calendario: 'Calendario',
  torneos: 'Eventos',
  asistencia: 'Asistencia',
  pagos: 'Pagos',
  configuracion: 'Configuración',
};

export default function Dashboard({ usuario, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('jugadores');
  const cargando = useCargando();

  // Colecciones desde el store (cache de la API)
  const jugadores = useStore((s) => s.jugadores);
  const entrenadores = useStore((s) => s.entrenadores);
  const categorias = useStore((s) => s.categorias);
  const torneos = useStore((s) => s.torneos);
  const convocatorias = useStore((s) => s.convocatorias);
  const asistencias = useStore((s) => s.asistencias);
  const pagos = useStore((s) => s.pagos);

  // Carga inicial desde la API
  useEffect(() => {
    cargarDatos().catch((e) => aviso(`No se pudieron cargar los datos: ${e.message}`, 'error'));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderComponentView = () => {
    switch (currentView) {
      case 'jugadores':
        return (
          <JugadoresView
            jugadores={jugadores}
            categorias={categorias}
            onAdd={crearEn('jugadores', '/api/jugadores')}
            onUpdate={actualizarEn('jugadores', '/api/jugadores')}
            onDelete={eliminarEn('jugadores', '/api/jugadores')}
          />
        );
      case 'entrenadores':
        return (
          <EntrenadoresView
            entrenadores={entrenadores}
            categorias={categorias}
            onAdd={crearEn('entrenadores', '/api/entrenadores')}
            onUpdate={actualizarEn('entrenadores', '/api/entrenadores')}
            onDelete={eliminarEn('entrenadores', '/api/entrenadores')}
          />
        );
      case 'categorias':
        return (
          <CategoriasView
            categorias={categorias}
            entrenadores={entrenadores}
            jugadores={jugadores}
            onAdd={crearEn('categorias', '/api/categorias')}
            onUpdate={actualizarEn('categorias', '/api/categorias')}
            onDelete={eliminarEn('categorias', '/api/categorias')}
          />
        );
      case 'calendario':
        return (
          <CalendarioView
            categorias={categorias}
            entrenadores={entrenadores}
            torneos={torneos}
          />
        );
      case 'torneos':
        return (
          <TorneosView
            torneos={torneos}
            categorias={categorias}
            jugadores={jugadores}
            convocatorias={convocatorias}
            onAdd={crearEn('torneos', '/api/torneos')}
            onUpdate={actualizarEn('torneos', '/api/torneos')}
            onDelete={eliminarEn('torneos', '/api/torneos')}
            onSaveConvocatoria={guardarConvocatoria}
          />
        );
      case 'asistencia':
        return (
          <AsistenciaView
            jugadores={jugadores}
            categorias={categorias}
            torneos={torneos}
            convocatorias={convocatorias}
            asistencias={asistencias}
            onSave={guardarAsistencia}
            onConfirmar={confirmarAsistencia}
          />
        );
      case 'pagos':
        return (
          <PagosView
            pagos={pagos}
            jugadores={jugadores}
            categorias={categorias}
            onAdd={crearEn('pagos', '/api/pagos')}
            onDelete={eliminarEn('pagos', '/api/pagos')}
            onConfirmar={(id) => cambiarEstadoPago(id, 'confirmar')}
            onRechazar={(id) => cambiarEstadoPago(id, 'rechazar')}
          />
        );
      case 'configuracion':
        return (
          <ConfiguracionView
            jugadores={jugadores}
            categorias={categorias}
            onRecargar={cargarDatos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-wrapper bg-light min-vh-screen ${!isSidebarOpen ? 'sidebar-collapse' : ''}`}>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        currentView={currentView}
        onViewChange={(viewId) => setCurrentView(viewId)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main
        className="app-main"
        style={{
          marginLeft: isSidebarOpen && window.innerWidth >= 768 ? '250px' : '0px',
          transition: 'margin-left 0.3s ease-in-out',
          minHeight: '100vh'
        }}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          usuario={usuario}
          onLogout={onLogout}
        />

        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h1 className="h3 mb-0 text-dark fw-bold">
              {TITULOS[currentView]}
            </h1>
            <span className="text-secondary small text-uppercase fw-semibold">
              Módulo / {TITULOS[currentView]}
            </span>
          </div>

          {cargando ? (
            <div className="text-center text-muted py-5">
              <div className="spinner-border text-success mb-3" role="status"></div>
              <p className="small">Cargando datos...</p>
            </div>
          ) : (
            renderComponentView()
          )}

        </div>
      </main>
    </div>
  );
}
