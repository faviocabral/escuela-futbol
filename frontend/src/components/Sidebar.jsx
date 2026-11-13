import React from 'react';

export const Sidebar = ({ isSidebarOpen, currentView, onViewChange, onToggleSidebar }) => {

  const menuItems = [
    { id: 'jugadores', label: 'Jugadores', icon: 'bi-person-arms-up' },
    { id: 'entrenadores', label: 'Entrenadores', icon: 'bi-person-badge' },
    { id: 'categorias', label: 'Categorías', icon: 'bi-diagram-3' },
    { id: 'torneos', label: 'Torneos', icon: 'bi-trophy' },
    { id: 'asistencia', label: 'Asistencia', icon: 'bi-check2-square' },
    { id: 'pagos', label: 'Pagos', icon: 'bi-cash-coin' },
  ];

  return (
    <aside
      className="app-sidebar bg-white shadow border-end"
      data-bs-theme="light"
      style={{
        position: 'fixed', top: 0, bottom: 0, left: 0,
        width: isSidebarOpen ? '250px' : '0px',
        overflowX: 'hidden', transition: 'width 0.3s ease-in-out', zIndex: 1038
      }}
    >
      <div className="sidebar-brand border-bottom py-3 text-center text-dark">
        <span className="brand-text fw-bold"
          onClick={onToggleSidebar}
          style={{ cursor: 'pointer' }}>
          <i className="bi bi-trophy-fill text-success me-1"></i> Escuela de Fútbol
        </span>
      </div>
      <div className="sidebar-wrapper p-3" style={{ width: '250px' }}>
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column list-unstyled">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <li key={item.id} className="nav-item mb-2">
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`nav-link text-start w-100 border-0 d-flex align-items-center py-2 px-3 ${isActive ? 'active bg-primary text-white fw-bold' : 'bg-transparent text-dark opacity-75'}`}
                  >
                    <i className={`bi ${item.icon} me-3 fs-5`}></i>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
