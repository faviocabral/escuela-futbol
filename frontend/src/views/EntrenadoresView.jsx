import React, { useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';

const FORM_VACIO = { nombre: '', apellido: '', telefono: '', email: '' };

export const EntrenadoresView = ({ entrenadores, categorias, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [buscar, setBuscar] = useState('');

  const categoriasDe = (entrenadorId) =>
    categorias.filter((c) => c.entrenadorId === entrenadorId).map((c) => c.nombre);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim()) return aviso('Nombre y apellido son obligatorios.');

    if (editandoId) {
      onUpdate({ ...form, id: editandoId });
      setEditandoId(null);
      toast('Entrenador actualizado');
    } else {
      onAdd(form);
      toast('Entrenador registrado');
    }
    setForm(FORM_VACIO);
  };

  const handleEditar = (ent) => {
    setForm({ nombre: ent.nombre, apellido: ent.apellido, telefono: ent.telefono, email: ent.email });
    setEditandoId(ent.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtrados = entrenadores.filter((ent) =>
    `${ent.nombre} ${ent.apellido} ${ent.email}`.toLowerCase().includes(buscar.toLowerCase())
  );

  const pag = usePaginacion(filtrados.length);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-person-badge text-primary me-2"></i>
              {editandoId ? 'Editar Entrenador' : 'Registrar Entrenador'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Nombre *</label>
                    <input type="text" name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Carlos" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Apellido *</label>
                    <input type="text" name="apellido" className="form-control" value={form.apellido} onChange={handleChange} placeholder="Ej: Méndez" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Teléfono</label>
                    <input type="text" name="telefono" className="form-control" value={form.telefono} onChange={handleChange} placeholder="Ej: 0981-123456" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Correo electrónico</label>
                    <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} placeholder="Ej: profe@escuela.com" />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    {editandoId && (
                      <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setForm(FORM_VACIO); setEditandoId(null); }}>
                        Cancelar
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary px-4 fw-medium">
                      {editandoId ? 'Guardar Cambios' : 'Registrar Entrenador'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-4 fw-bold">
                  <i className="bi bi-list-ul text-success me-2"></i> Listado de Entrenadores
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-4 ms-auto">
                  <input type="text" className="form-control form-control-sm" placeholder="Buscar por nombre o correo..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Entrenador</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Categorías a cargo</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        No hay entrenadores registrados.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((ent) => {
                      const cats = categoriasDe(ent.id);
                      return (
                        <tr key={ent.id}>
                          <td className="px-3 fw-semibold">{ent.nombre} {ent.apellido}</td>
                          <td>{ent.telefono || '-'}</td>
                          <td>{ent.email || '-'}</td>
                          <td>
                            {cats.length === 0 ? (
                              <span className="text-muted small">Sin asignar</span>
                            ) : (
                              cats.map((n) => <span key={n} className="badge bg-primary-subtle text-primary me-1">{n}</span>)
                            )}
                          </td>
                          <td className="px-3 text-end">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditar(ent)} title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar(`¿Eliminar a ${ent.nombre} ${ent.apellido}?`)) onDelete(ent.id); }} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Paginador
              pagina={pag.pagina}
              totalPaginas={pag.totalPaginas}
              onChange={pag.setPagina}
              porPagina={pag.porPagina}
              onPorPagina={pag.cambiarPorPagina}
              desde={pag.desde}
              hasta={pag.hasta}
              total={filtrados.length}
            />
          </div>
        </div>
      </div>
    </>
  );
};
