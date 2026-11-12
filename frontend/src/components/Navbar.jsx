import React from 'react';

export const Navbar = ({ onToggleSidebar, usuario, onLogout }) => {

  const iniciales = (usuario?.nombre || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <nav className="navbar navbar-expand bg-white border-bottom px-4 w-100 sticky-top shadow-sm" style={{ height: '56px' }}>
      <div className="container-fluid p-0 d-flex align-items-center">

        <div className="d-flex align-items-center">
          <button
            className="btn text-dark "
            onClick={onToggleSidebar}
            type="button"
            style={{ cursor: 'pointer', display: 'block' }}
          >
            <i className="bi bi-list fs-3"></i>
          </button>

          <span className="navbar-brand text-dark fw-bold m-0 fs-5">
            Escuela de Fútbol
          </span>
        </div>

        <div className="ms-auto d-flex align-items-center gap-3">

          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-semibold d-none d-sm-inline">
              {usuario?.nombre || 'Usuario'}
            </span>
            <div
              className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase small"
              style={{ width: '32px', height: '32px', fontSize: '12px' }}
            >
              {iniciales}
            </div>
          </div>

          <div className="border-start h-100 py-2 text-black-50 opacity-25 d-none d-sm-block" style={{ width: '1px' }}></div>

          <button
            onClick={onLogout}
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 rounded-pill fw-medium"
            style={{ fontSize: '13px' }}
          >
            <i className="bi bi-box-arrow-right fs-6"></i>
            <span className="d-none d-md-inline">Salir</span>
          </button>

        </div>

      </div>
    </nav>
  );
};
