import React, { useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';

const FORM_VACIO = { nombre: '', fecha: '', lugar: '', categoriaId: '' };

const formatearFecha = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const TorneosView = ({ torneos, categorias, jugadores, convocatorias, onAdd, onUpdate, onDelete, onSaveConvocatoria }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  // Panel de convocatoria: torneo abierto + selección de jugadores
  const [torneoConvocatoria, setTorneoConvocatoria] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);

  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || '-';

  const convocadosDe = (torneoId) => convocatorias.filter((c) => c.torneoId === torneoId).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return aviso('El nombre del torneo es obligatorio.');
    if (!form.fecha) return aviso('Selecciona la fecha del torneo.');
    if (!form.categoriaId) return aviso('Selecciona la categoría participante.');

    const registro = { ...form, categoriaId: Number(form.categoriaId) };
    if (editandoId) {
      onUpdate({ ...registro, id: editandoId });
      setEditandoId(null);
      toast('Torneo actualizado');
    } else {
      onAdd(registro);
      toast('Torneo agendado');
    }
    setForm(FORM_VACIO);
  };

  const handleEditar = (t) => {
    setForm({ nombre: t.nombre, fecha: t.fecha, lugar: t.lugar, categoriaId: String(t.categoriaId) });
    setEditandoId(t.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirConvocatoria = (torneo) => {
    setTorneoConvocatoria(torneo);
    setSeleccionados(
      convocatorias.filter((c) => c.torneoId === torneo.id).map((c) => c.jugadorId)
    );
  };

  const toggleJugador = (jugadorId) => {
    setSeleccionados((prev) =>
      prev.includes(jugadorId) ? prev.filter((id) => id !== jugadorId) : [...prev, jugadorId]
    );
  };

  const guardarConvocatoria = () => {
    onSaveConvocatoria(torneoConvocatoria.id, seleccionados);
    setTorneoConvocatoria(null);
    setSeleccionados([]);
    toast('Convocatoria guardada');
  };

  const filtrados = torneos
    .filter((t) =>
      `${t.nombre} ${t.lugar}`.toLowerCase().includes(buscar.toLowerCase()) &&
      (filtroCategoria === '' || t.categoriaId === Number(filtroCategoria))
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const pag = usePaginacion(filtrados.length);

  const jugadoresConvocables = torneoConvocatoria
    ? jugadores.filter((j) => j.categoriaId === torneoConvocatoria.categoriaId && j.activo)
    : [];

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-trophy text-primary me-2"></i>
              {editandoId ? 'Editar Torneo' : 'Nuevo Torneo'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Nombre del torneo *</label>
                    <input type="text" name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Copa Primavera" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Fecha *</label>
                    <input type="date" name="fecha" className="form-control" value={form.fecha} onChange={handleChange} />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Lugar / Sede</label>
                    <input type="text" name="lugar" className="form-control" value={form.lugar} onChange={handleChange} placeholder="Ej: Club Nacional" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Categoría *</label>
                    <select name="categoriaId" className="form-select" value={form.categoriaId} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    {editandoId && (
                      <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setForm(FORM_VACIO); setEditandoId(null); }}>
                        Cancelar
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary px-4 fw-medium">
                      {editandoId ? 'Guardar Cambios' : 'Agendar Torneo'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de convocatoria */}
      {torneoConvocatoria && (
        <div className="row g-4 mb-3">
          <div className="col-12">
            <div className="card shadow-sm border border-primary">
              <div className="card-header bg-primary-subtle py-3 fw-bold border-bottom d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-clipboard-check text-primary me-2"></i>
                  Convocatoria — {torneoConvocatoria.nombre} ({categoriaNombre(torneoConvocatoria.categoriaId)})
                </span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setTorneoConvocatoria(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="card-body">
                {jugadoresConvocables.length === 0 ? (
                  <p className="text-muted mb-0">No hay jugadores activos en esta categoría.</p>
                ) : (
                  <>
                    <p className="small text-muted mb-3">
                      Marca los jugadores convocados. Seleccionados: <b>{seleccionados.length}</b>
                    </p>
                    <div className="row g-2">
                      {jugadoresConvocables.map((j) => (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={j.id}>
                          <div className={`border rounded p-2 d-flex align-items-center gap-2 ${seleccionados.includes(j.id) ? 'border-success bg-success-subtle' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleJugador(j.id)}>
                            <input type="checkbox" className="form-check-input m-0" checked={seleccionados.includes(j.id)} readOnly />
                            <span className="small fw-medium">{j.nombre} {j.apellido}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="card-footer bg-white text-end">
                <button className="btn btn-success px-4 fw-medium" onClick={guardarConvocatoria}>
                  <i className="bi bi-check2 me-1"></i> Guardar Convocatoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-4 fw-bold">
                  <i className="bi bi-calendar-event text-success me-2"></i> Calendario de Torneos
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-8">
                  <div className="row g-2">
                    <div className="col-12 col-sm-7">
                      <input type="text" className="form-control form-control-sm" placeholder="Buscar por nombre o lugar..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                    </div>
                    <div className="col-12 col-sm-5">
                      <select className="form-select form-select-sm" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Fecha</th>
                    <th>Torneo</th>
                    <th>Lugar</th>
                    <th>Categoría</th>
                    <th>Convocados</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5">
                        No hay torneos agendados.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((t) => {
                      const pasado = t.fecha < new Date().toISOString().slice(0, 10);
                      return (
                        <tr key={t.id}>
                          <td className="px-3">
                            <span className={`badge ${pasado ? 'bg-secondary' : 'bg-success'}`}>
                              {formatearFecha(t.fecha)}
                            </span>
                          </td>
                          <td className="fw-semibold">{t.nombre}</td>
                          <td>{t.lugar || '-'}</td>
                          <td><span className="badge bg-primary-subtle text-primary">{categoriaNombre(t.categoriaId)}</span></td>
                          <td>
                            <button className="btn btn-sm btn-outline-success" onClick={() => abrirConvocatoria(t)}>
                              <i className="bi bi-clipboard-check me-1"></i>
                              {convocadosDe(t.id)} convocados
                            </button>
                          </td>
                          <td className="px-3 text-end">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditar(t)} title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar(`¿Eliminar el torneo "${t.nombre}"?`)) onDelete(t.id); }} title="Eliminar">
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
