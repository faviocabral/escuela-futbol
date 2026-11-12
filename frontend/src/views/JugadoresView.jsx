import React, { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';

const FORM_VACIO = {
  nombre: '', apellido: '', documento: '', fechaNacimiento: '',
  categoriaId: '', tutor: '', telefonoTutor: '', activo: true, foto: null,
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '-';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

export const JugadoresView = ({ jugadores, categorias, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || 'Sin categoría';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((prev) => ({ ...prev, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim()) return alert('Nombre y apellido son obligatorios.');
    if (!form.categoriaId) return alert('Selecciona una categoría.');

    const registro = { ...form, categoriaId: Number(form.categoriaId) };
    if (editandoId) {
      onUpdate({ ...registro, id: editandoId });
      setEditandoId(null);
    } else {
      onAdd(registro);
    }
    setForm(FORM_VACIO);
  };

  const handleEditar = (j) => {
    setForm({ ...j, categoriaId: String(j.categoriaId) });
    setEditandoId(j.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
  };

  const filtrados = jugadores.filter((j) => {
    const texto = `${j.nombre} ${j.apellido} ${j.documento}`.toLowerCase();
    return (
      texto.includes(buscar.toLowerCase()) &&
      (filtroCategoria === '' || j.categoriaId === Number(filtroCategoria)) &&
      (filtroEstado === '' || j.activo === (filtroEstado === 'activo'))
    );
  });

  const pag = usePaginacion(filtrados.length);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-person-arms-up text-primary me-2"></i>
              {editandoId ? 'Editar Jugador' : 'Ficha de Jugador'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Foto del jugador */}
                  <div className="col-12 d-flex align-items-center gap-3 mb-1">
                    <Avatar jugador={form} size={72} />
                    <div className="flex-grow-1">
                      <label className="form-label small fw-semibold text-secondary mb-1">Foto del jugador</label>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          accept="image/*"
                          onChange={handleFoto}
                        />
                        {form.foto && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger text-nowrap"
                            onClick={() => setForm((prev) => ({ ...prev, foto: null }))}
                          >
                            <i className="bi bi-x-lg me-1"></i> Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Nombre *</label>
                    <input type="text" name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Thiago" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Apellido *</label>
                    <input type="text" name="apellido" className="form-control" value={form.apellido} onChange={handleChange} placeholder="Ej: Vera" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Documento / CI</label>
                    <input type="text" name="documento" className="form-control" value={form.documento} onChange={handleChange} placeholder="Ej: 5123456" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Fecha de Nacimiento</label>
                    <input type="date" name="fechaNacimiento" className="form-control" value={form.fechaNacimiento} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Categoría *</label>
                    <select name="categoriaId" className="form-select" value={form.categoriaId} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} ({c.edadMin}-{c.edadMax} años)</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Tutor / Padre-Madre</label>
                    <input type="text" name="tutor" className="form-control" value={form.tutor} onChange={handleChange} placeholder="Nombre del responsable" />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Teléfono del Tutor</label>
                    <input type="text" name="telefonoTutor" className="form-control" value={form.telefonoTutor} onChange={handleChange} placeholder="Ej: 0981-123456" />
                  </div>
                  <div className="col-12 d-flex align-items-center justify-content-between">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" name="activo" id="jugadorActivo" checked={form.activo} onChange={handleChange} />
                      <label className="form-check-label small fw-semibold text-secondary" htmlFor="jugadorActivo">Jugador activo</label>
                    </div>
                    <div className="d-flex gap-2">
                      {editandoId && (
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={handleCancelar}>
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="btn btn-primary px-4 fw-medium">
                        {editandoId ? 'Guardar Cambios' : 'Registrar Jugador'}
                      </button>
                    </div>
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
                  <i className="bi bi-list-ul text-success me-2"></i> Listado de Jugadores
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-8">
                  <div className="row g-2">
                    <div className="col-12 col-sm-5">
                      <input type="text" className="form-control form-control-sm" placeholder="Buscar por nombre o documento..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                    </div>
                    <div className="col-6 col-sm-4">
                      <select className="form-select form-select-sm" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-sm-3">
                      <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Jugador</th>
                    <th>Documento</th>
                    <th>Categoría</th>
                    <th>Edad</th>
                    <th>Tutor / Teléfono</th>
                    <th>Estado</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-5">
                        No hay jugadores que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((j) => (
                      <tr key={j.id}>
                        <td className="px-3 fw-semibold">
                          <div className="d-flex align-items-center gap-2">
                            <Avatar jugador={j} size={36} />
                            <span>{j.nombre} {j.apellido}</span>
                          </div>
                        </td>
                        <td>{j.documento || '-'}</td>
                        <td><span className="badge bg-primary-subtle text-primary">{categoriaNombre(j.categoriaId)}</span></td>
                        <td>{calcularEdad(j.fechaNacimiento)}</td>
                        <td>
                          <div className="small">{j.tutor || '-'}</div>
                          <div className="small text-muted">{j.telefonoTutor || ''}</div>
                        </td>
                        <td>
                          <span className={`badge ${j.activo ? 'bg-success' : 'bg-secondary'}`}>
                            {j.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-3 text-end">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditar(j)} title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => { if (confirm(`¿Eliminar a ${j.nombre} ${j.apellido}?`)) onDelete(j.id); }} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Paginador
              pagina={pag.pagina}
              totalPaginas={pag.totalPaginas}
              onChange={pag.setPagina}
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
