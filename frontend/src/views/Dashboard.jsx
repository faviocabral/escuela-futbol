import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ClientesView } from './ClientesView';
import { FacturasView } from './FacturasView';
import { Navbar } from '../components/Navbar';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Estado para controlar qué componente hijo se va a renderizar
  const [currentView, setCurrentView] = useState('clientes');

  // Estado global compartido: Lista de clientes registrados en memoria
  const [clientes, setClientes] = useState([
    { id: '1', nombre: 'Distribuidora Alborada S.A.', ruc: '80012345-6' },
    { id: '2', nombre: 'Comercial El Trébol', ruc: '4455667-2' }
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para inyectar un nuevo cliente desde la vista hija
  const handleAddCliente = (nuevoCliente) => {
    setClientes((prev) => [...prev, nuevoCliente]);
  };

  // Renderizado condicional del componente hijo (Virtual Children)
  const renderComponentView = () => {
    switch (currentView) {
      case 'clientes':
        return <ClientesView clientes={clientes} onAddCliente={handleAddCliente} />;
      case 'facturas':
        return <FacturasView clientes={clientes} />;
      default:
        return <ClientesView clientes={clientes} onAddCliente={handleAddCliente} />;
    }
  };

  return (
    <div className={`app-wrapper bg-light min-vh-screen ${!isSidebarOpen ? 'sidebar-collapse' : ''}`}>
      
      {/* Sidebar fijo (Recibe el controlador del componente activo) */}
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
        {/* Navbar Superior Fijo */}
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* CONTENIDO INTERNO DINÁMICO (Cambia sin parpadear el layout) */}
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h1 className="h3 mb-0 text-dark fw-bold text-capitalize">
              Gestión de {currentView}
            </h1>
            <span className="text-secondary small text-uppercase fw-semibold">
              Módulo / {currentView}
            </span>
          </div>

          {/* Aquí se inyecta el hijo seleccionado */}
          {renderComponentView()}

        </div>
      </main>
    </div>
  );
}
