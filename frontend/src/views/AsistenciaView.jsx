import React, { useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';

const formatearFecha = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const AsistenciaView = ({ jugadores, categorias, torneos, convocatorias, asistencias, onSave }) => {
  const [modo, setModo] = useState('entrenamiento'); // 'entrenamiento' | 'torneo'
  const [torneoId, setTorneoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [marcas, setMarcas] = useState({}); // jugadorId -> presente

  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || '-';
  const jugadorNombre = (id) => {
    const j = jugadores.find((x) => x.id === id);
    return j ? `${j.nombre} ${j.apellido}` : `#${id}`;
  };

  const torneoSel = torneos.find((t) => t.id === Number(torneoId));

  // Jugadores a listar según el modo elegido
  const jugadoresLista =
    modo === 'torneo'
      ? torneoSel
        ? convocatorias
            .filter((c) => c.torneoId === torneoSel.id)
            .map((c) => jugadores.find((j) => j.id === c.jugadorId))
            .filter(Boolean)
        : []
      : categoriaId
        ? jugadores.filter((j) => j.categoriaId === Number(categoriaId) && j.activo)
        : [];

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setMarcas({});
  };

  const cargarPlanilla = () => {
    // Si ya existe planilla guardada, precarga las marcas
    const existente = asistencias.find((a) =>
      modo === 'torneo'
        ? a.torneoId === Number(torneoId)
        : a.tipo === 'entrenamiento' && a.categoriaId === Number(categoriaId) && a.fecha === fecha
    );
    const inicial = {};
    jugadoresLista.forEach((j) => {
      inicial[j.id] = existente?.registros.find((r) => r.jugadorId === j.id)?.presente ?? true;
    });
    setMarcas(inicial);
  };

  const toggleMarca = (jugadorId) =>
    setMarcas((prev) => ({ ...prev, [jugadorId]: !prev[jugadorId] }));

  const guardar = () => {
    if (jugadoresLista.length === 0) return alert('No hay jugadores en la lista.');
    const planilla =
      modo === 'torneo'
        ? {
            tipo: 'torneo',
            torneoId: torneoSel.id,
            categoriaId: torneoSel.categoriaId,
            fecha: torneoSel.fecha,
            registros: jugadoresLista.map((j) => ({ jugadorId: j.id, presente: !!marcas[j.id] })),
          }
        : {
            tipo: 'entrenamiento',
            torneoId: null,
            categoriaId: Number(categoriaId),
            fecha,
            registros: jugadoresLista.map((j) => ({ jugadorId: j.id, presente: !!marcas[j.id] })),
          };
    onSave(planilla);
    alert(`Asistencia guardada: ${planilla.registros.filter((r) => r.presente).length}/${planilla.registros.length} presentes.`);
    setMarcas({});
  };

  const historial = [...asistencias].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pag = usePaginacion(historial.length);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-check2-square text-primary me-2"></i> Marcar Asistencia
            </div>
            <div className="card-body">
              {/* Selector de modo */}
              <ul className="nav nav-pills mb-3">
                <li className="nav-item">
                  <button className={`nav-link ${modo === 'entrenamiento' ? 'active' : ''}`} onClick={() => cambiarModo('entrenamiento')}>
                    <i className="bi bi-stopwatch me-1"></i> Entrenamiento
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${modo === 'torneo' ? 'active' : ''}`} onClick={() => cambiarModo('torneo')}>
                    <i className="bi bi-trophy me-1"></i> Torneo
                  </button>
                </li>
              </ul>

              <div className="row g-3 align-items-end">
                {modo === 'torneo' ? (
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Torneo (usa la lista de convocados)</label>
                    <select className="form-select" value={torneoId} onChange={(e) => { setTorneoId(e.target.value); setMarcas({}); }}>
                      <option value="">Seleccionar torneo...</option>
                      {torneos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} — {formatearFecha(t.fecha)} ({categoriaNombre(t.categoriaId)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Categoría</label>
                      <select className="form-select" value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setMarcas({}); }}>
                        <option value="">Seleccionar categoría...</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Fecha del entrenamiento</label>
                      <input type="date" className="form-control" value={fecha} onChange={(e) => { setFecha(e.target.value); setMarcas({}); }} />
                    </div>
                  </>
                )}
                <div className="col-6 col-md-2">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={cargarPlanilla}
                    disabled={jugadoresLista.length === 0}
                  >
                    <i className="bi bi-list-check me-1"></i> Cargar lista
                  </button>
                </div>
              </div>

              {/* Lista de jugadores para marcar */}
              {jugadoresLista.length > 0 && Object.keys(marcas).length > 0 && (
                <div className="mt-4">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle m-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-3">Jugador</th>
                          <th className="text-center" style={{ width: '120px' }}>Presente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jugadoresLista.map((j) => (
                          <tr key={j.id} className={marcas[j.id] ? '' : 'table-danger-subtle'}>
                            <td className="px-3 fw-medium">{j.nombre} {j.apellido}</td>
                            <td className="text-center">
                              <div className="form-check form-switch d-inline-block">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!marcas[j.id]}
                                  onChange={() => toggleMarca(j.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-success px-4 fw-medium" onClick={guardar}>
                      <i className="bi bi-check2 me-1"></i> Guardar Asistencia
                    </button>
                  </div>
                </div>
              )}

              {jugadoresLista.length === 0 && modo === 'torneo' && torneoId && (
                <p className="text-muted mt-3 mb-0">Este torneo no tiene convocados. Defínelos en el módulo Torneos.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-clock-history text-success me-2"></i> Historial de Planillas
              <span className="badge bg-secondary ms-2">{historial.length}</span>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Fecha</th>
                    <th>Tipo</th>
                    <th>Referencia</th>
                    <th>Presentes</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        Todavía no se registraron planillas de asistencia.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(historial).map((a) => {
                      const presentes = a.registros.filter((r) => r.presente).length;
                      const torneo = a.torneoId ? torneos.find((t) => t.id === a.torneoId) : null;
                      return (
                        <tr key={a.id}>
                          <td className="px-3">{formatearFecha(a.fecha)}</td>
                          <td>
                            <span className={`badge ${a.tipo === 'torneo' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-info-subtle text-info-emphasis'}`}>
                              {a.tipo === 'torneo' ? 'Torneo' : 'Entrenamiento'}
                            </span>
                          </td>
                          <td>{torneo ? torneo.nombre : categoriaNombre(a.categoriaId)}</td>
                          <td>
                            <span className="badge bg-success-subtle text-success">
                              {presentes}/{a.registros.length}
                            </span>
                          </td>
                          <td className="small text-muted">
                            {a.registros.filter((r) => r.presente).map((r) => jugadorNombre(r.jugadorId)).join(', ') || 'Sin presentes'}
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
              desde={pag.desde}
              hasta={pag.hasta}
              total={historial.length}
            />
          </div>
        </div>
      </div>
    </>
  );
};
