import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { JugadoresView } from './JugadoresView';
import { EntrenadoresView } from './EntrenadoresView';
import { CategoriasView } from './CategoriasView';
import { TorneosView } from './TorneosView';
import { AsistenciaView } from './AsistenciaView';
import { PagosView } from './PagosView';
import {
  categoriasMock,
  entrenadoresMock,
  jugadoresMock,
  torneosMock,
  convocatoriasMock,
  asistenciasMock,
  pagosMock,
} from '../mockData';

const TITULOS = {
  jugadores: 'Jugadores',
  entrenadores: 'Entrenadores',
  categorias: 'Categorías',
  torneos: 'Torneos',
  asistencia: 'Asistencia',
  pagos: 'Pagos',
};

export default function Dashboard({ usuario, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('jugadores');

  // Estado global mock — luego se reemplaza por llamadas a la API
  const [jugadores, setJugadores] = useState(jugadoresMock);
  const [entrenadores, setEntrenadores] = useState(entrenadoresMock);
  const [categorias, setCategorias] = useState(categoriasMock);
  const [torneos, setTorneos] = useState(torneosMock);
  const [convocatorias, setConvocatorias] = useState(convocatoriasMock);
  const [asistencias, setAsistencias] = useState(asistenciasMock);
  const [pagos, setPagos] = useState(pagosMock);

  const nextId = (lista) => (lista.length ? Math.max(...lista.map((i) => i.id)) + 1 : 1);

  // Alta genérica: devuelve una función que agrega el registro a la colección
  const crear = (setter, lista) => (registro) =>
    setter((prev) => [...prev, { ...registro, id: nextId(lista) }]);

  const actualizar = (setter) => (registro) =>
    setter((prev) => prev.map((i) => (i.id === registro.id ? registro : i)));

  const eliminar = (setter) => (id) =>
    setter((prev) => prev.filter((i) => i.id !== id));

  const guardarConvocatoria = (torneoId, jugadorIds) => {
    setConvocatorias((prev) => {
      const resto = prev.filter((c) => c.torneoId !== torneoId);
      const nuevas = jugadorIds.map((jugadorId, idx) => ({
        id: nextId(prev) + idx,
        torneoId,
        jugadorId,
      }));
      return [...resto, ...nuevas];
    });
  };

  const guardarAsistencia = (planilla) => {
    setAsistencias((prev) => {
      // Si ya existe planilla para ese torneo o (categoría+fecha), se reemplaza
      const filtradas = prev.filter((a) =>
        planilla.tipo === 'torneo'
          ? a.torneoId !== planilla.torneoId
          : !(a.tipo === 'entrenamiento' && a.categoriaId === planilla.categoriaId && a.fecha === planilla.fecha)
      );
      return [...filtradas, { ...planilla, id: nextId(prev) }];
    });
  };

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
            onAdd={crear(setJugadores, jugadores)}
            onUpdate={actualizar(setJugadores)}
            onDelete={eliminar(setJugadores)}
          />
        );
      case 'entrenadores':
        return (
          <EntrenadoresView
            entrenadores={entrenadores}
            categorias={categorias}
            onAdd={crear(setEntrenadores, entrenadores)}
            onUpdate={actualizar(setEntrenadores)}
            onDelete={eliminar(setEntrenadores)}
          />
        );
      case 'categorias':
        return (
          <CategoriasView
            categorias={categorias}
            entrenadores={entrenadores}
            jugadores={jugadores}
            onAdd={crear(setCategorias, categorias)}
            onUpdate={actualizar(setCategorias)}
            onDelete={eliminar(setCategorias)}
          />
        );
      case 'torneos':
        return (
          <TorneosView
            torneos={torneos}
            categorias={categorias}
            jugadores={jugadores}
            convocatorias={convocatorias}
            onAdd={crear(setTorneos, torneos)}
            onUpdate={actualizar(setTorneos)}
            onDelete={eliminar(setTorneos)}
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
          />
        );
      case 'pagos':
        return (
          <PagosView
            pagos={pagos}
            jugadores={jugadores}
            categorias={categorias}
            onAdd={crear(setPagos, pagos)}
            onDelete={eliminar(setPagos)}
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

          {renderComponentView()}

        </div>
      </main>
    </div>
  );
}
