import React, { useState } from 'react';

export const ClientesView = ({ clientes, onAddCliente }) => {
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !ruc.trim()) return alert('Completa todos los campos');
    
    // Crear un nuevo cliente con un ID único
    const nuevoCliente = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      ruc: ruc.trim()
    };

    onAddCliente(nuevoCliente);
    setNombre('');
    setRuc('');
    alert('Cliente registrado con éxito');
  };

  return (
    <>
    <div className="row g-4">
        {/* Formulario de Registro */}
        <div className="col-12 col-lg-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-person-plus text-primary me-2"></i> Registrar Cliente
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary">Nombre / Razón Social</label>
                    <input 
                      type="text" className="form-control" value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary">RUC / Documento</label>
                    <input 
                      type="text" className="form-control" value={ruc} 
                      onChange={(e) => setRuc(e.target.value)} placeholder="Ej: 1234567-8"
                    />
                  </div>
                </div>
                <div className="row g-4" style={{ marginTop: '1px' }}>
                  <div className="col-6 "></div>
                  <div className="col-6 ">
                    <button type="submit" className="btn btn-primary w-100 fw-medium">
                      Guardar Cliente
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>    
    </div>    
    <div className="row g-4 mt-1">


      {/* Listado de Clientes */}
      <div className="col-12 col-lg-12">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 fw-bold border-bottom">
            <i className="bi bi-people text-success me-2"></i> Listado de Clientes
          </div>
          <div className="card-body p-0 table-responsive">
            <table className="table table-hover align-middle m-0 table-striped">
              <thead className="table-light">
                <tr>
                  <th className="px-3" style={{ width: '20%' }}>ID Interno</th>
                  <th>Nombre</th>
                  <th>RUC / Documento</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-muted py-5">
                      No hay clientes registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 text-secondary font-monospace">#{c.id.slice(-5)}</td>
                      <td className="fw-medium text-dark">{c.nombre}</td>
                      <td>{c.ruc}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
