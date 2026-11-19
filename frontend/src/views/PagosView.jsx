import React, { useEffect, useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';
import { apiFetch } from '../api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;
const fmtFecha = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '-');
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ESTADO_BADGE = {
  pendiente: 'bg-info-subtle text-info-emphasis',
  en_revision: 'bg-warning-subtle text-warning-emphasis',
  confirmado: 'bg-success-subtle text-success-emphasis',
  rechazado: 'bg-danger-subtle text-danger-emphasis',
};
const ESTADO_LABEL = {
  pendiente: 'Pendiente', en_revision: 'En revisión', confirmado: 'Pagado', rechazado: 'Rechazado',
};
const esVencida = (p) =>
  p.estado === 'pendiente' && p.vencimiento && p.vencimiento.slice(0, 10) < hoyLocal();

export const PagosView = ({ pagos, jugadores, categorias, onAdd, onDelete, onConfirmar, onRechazar, onRecargar }) => {
  const hoy = new Date();
  const [jugadorId, setJugadorId] = useState('');
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');

  const [filtroJugador, setFiltroJugador] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Configuración de cuotas + generador anual
  const [cfg, setCfg] = useState(null);
  const [guardandoCfg, setGuardandoCfg] = useState(false);
  const [genAnio, setGenAnio] = useState(hoy.getFullYear());
  const [genAlcance, setGenAlcance] = useState('todos');
  const [genCatId, setGenCatId] = useState('');
  const [genJugId, setGenJugId] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    apiFetch('/api/config')
      .then((c) => { setCfg(c); setMonto(Number(c.cuota_monto) || ''); })
      .catch(() => {});
  }, []);

  const guardarConfig = async () => {
    setGuardandoCfg(true);
    try {
      const c = await apiFetch('/api/config', {
        method: 'PUT',
        body: JSON.stringify({
          cuota_monto: cfg.cuota_monto,
          cuota_mes_inicio: cfg.cuota_mes_inicio,
          cuota_mes_fin: cfg.cuota_mes_fin,
          cuota_dia_vencimiento: cfg.cuota_dia_vencimiento,
        }),
      });
      setCfg(c);
      toast('Configuración guardada');
    } catch (e) {
      aviso(e.message, 'error');
    } finally {
      setGuardandoCfg(false);
    }
  };

  const generarCuotas = async () => {
    if (genAlcance === 'categoria' && !genCatId) return aviso('Elegí la categoría.');
    if (genAlcance === 'jugador' && !genJugId) return aviso('Elegí el jugador.');
    setGenerando(true);
    try {
      const r = await apiFetch('/api/cuotas/generar', {
        method: 'POST',
        body: JSON.stringify({
          anio: Number(genAnio), alcance: genAlcance,
          categoriaId: genCatId ? Number(genCatId) : undefined,
          jugadorId: genJugId ? Number(genJugId) : undefined,
        }),
      });
      toast(`${r.generadas} cuota(s) generada(s)${r.saltadas ? ` — ${r.saltadas} ya existían` : ''}`);
      onRecargar?.();
    } catch (e) {
      aviso(e.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  const jugadorNombre = (id) => {
    const j = jugadores.find((x) => x.id === id);
    return j ? `${j.nombre} ${j.apellido}` : `#${id}`;
  };
  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || '-';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jugadorId) return aviso('Selecciona el jugador.');
    if (Number(monto) <= 0) return aviso('El monto debe ser mayor a 0.');

    const duplicado = pagos.find(
      (p) => p.jugadorId === Number(jugadorId) && p.mes === Number(mes) && p.anio === Number(anio) && p.estado !== 'rechazado'
    );
    // Una cuota 'pendiente' se liquida como pagada; el resto no admite duplicado
    if (duplicado && duplicado.estado !== 'pendiente') {
      return aviso(`Ese período ya está ${ESTADO_LABEL[duplicado.estado]?.toLowerCase() || 'cargado'} para ${jugadorNombre(Number(jugadorId))}.`);
    }

    const guardado = await onAdd({
      jugadorId: Number(jugadorId),
      mes: Number(mes),
      anio: Number(anio),
      monto: Number(monto),
      metodo,
      fechaPago: hoy.toISOString().slice(0, 10),
    });
    if (!guardado) return;
    toast('Pago registrado');
    setJugadorId('');
  };

  const verComprobante = async (pagoId) => {
    try {
      const { url } = await apiFetch(`/api/pagos/${pagoId}/comprobante`);
      window.open(url, '_blank');
    } catch (err) {
      aviso(err.message, 'error');
    }
  };

  const filtrados = pagos
    .filter((p) =>
      (filtroJugador === '' || p.jugadorId === Number(filtroJugador)) &&
      (filtroMes === '' || p.mes === Number(filtroMes)) &&
      (filtroAnio === '' || p.anio === Number(filtroAnio)) &&
      (filtroEstado === '' || p.estado === filtroEstado)
    )
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes || b.fechaPago.localeCompare(a.fechaPago));

  const pag = usePaginacion(filtrados.length);

  // Pendientes del mes/año filtrado (o el actual si no hay filtro)
  const mesRef = filtroMes === '' ? hoy.getMonth() + 1 : Number(filtroMes);
  const anioRef = filtroAnio === '' ? hoy.getFullYear() : Number(filtroAnio);
  const pendientes = jugadores
    .filter((j) => j.activo)
    .filter((j) => !pagos.some((p) => p.jugadorId === j.id && p.mes === mesRef && p.anio === anioRef && p.estado !== 'rechazado'));

  const pendientesConfirmacion = filtrados.filter((p) => p.estado === 'en_revision').length;
  const totalFiltrado = filtrados.filter((p) => p.estado === 'confirmado').reduce((acc, p) => acc + Number(p.monto), 0);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-cash-coin text-primary me-2"></i> Registrar Pago de Mensualidad
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Jugador *</label>
                    <select className="form-select" value={jugadorId} onChange={(e) => setJugadorId(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {jugadores.filter((j) => j.activo).map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nombre} {j.apellido} ({categoriaNombre(j.categoriaId)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Mes *</label>
                    <select className="form-select" value={mes} onChange={(e) => setMes(e.target.value)}>
                      {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Año *</label>
                    <input type="number" className="form-control" value={anio} onChange={(e) => setAnio(e.target.value)} min="2020" max="2100" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Monto (Gs.) *</label>
                    <input type="number" className="form-control" value={monto} onChange={(e) => setMonto(e.target.value)} min="0" step="1000" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Método</label>
                    <select className="form-select" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                      <option>Efectivo</option>
                      <option>Transferencia</option>
                      <option>QR / Billetera</option>
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary px-4 fw-medium">
                      Registrar Pago
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de cuotas + generador anual */}
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-gear text-primary me-2"></i> Cuotas del año
            </div>
            <div className="card-body">
              {!cfg ? (
                <div className="text-muted small">Cargando configuración…</div>
              ) : (
                <>
                  <div className="row g-2 align-items-end border-bottom pb-3 mb-3">
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Monto cuota (Gs.)</label>
                      <input type="number" className="form-control form-control-sm" value={cfg.cuota_monto}
                        onChange={(e) => setCfg({ ...cfg, cuota_monto: e.target.value })} min="0" step="1000" />
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Desde</label>
                      <select className="form-select form-select-sm" value={cfg.cuota_mes_inicio}
                        onChange={(e) => setCfg({ ...cfg, cuota_mes_inicio: e.target.value })}>
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Hasta</label>
                      <select className="form-select form-select-sm" value={cfg.cuota_mes_fin}
                        onChange={(e) => setCfg({ ...cfg, cuota_mes_fin: e.target.value })}>
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Vence el día</label>
                      <input type="number" className="form-control form-control-sm" value={cfg.cuota_dia_vencimiento}
                        onChange={(e) => setCfg({ ...cfg, cuota_dia_vencimiento: e.target.value })} min="1" max="28" />
                    </div>
                    <div className="col-12 col-md-4 text-md-end">
                      <button className="btn btn-sm btn-outline-primary" disabled={guardandoCfg} onClick={guardarConfig}>
                        <i className="bi bi-save me-1"></i>Guardar configuración
                      </button>
                    </div>
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Año</label>
                      <input type="number" className="form-control form-control-sm" value={genAnio}
                        onChange={(e) => setGenAnio(e.target.value)} min="2020" max="2100" />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Generar para</label>
                      <select className="form-select form-select-sm" value={genAlcance} onChange={(e) => setGenAlcance(e.target.value)}>
                        <option value="todos">Todos los jugadores activos</option>
                        <option value="categoria">Una categoría</option>
                        <option value="jugador">Un jugador</option>
                      </select>
                    </div>
                    {genAlcance === 'categoria' && (
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-semibold text-secondary">Categoría</label>
                        <select className="form-select form-select-sm" value={genCatId} onChange={(e) => setGenCatId(e.target.value)}>
                          <option value="">Seleccionar...</option>
                          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>
                    )}
                    {genAlcance === 'jugador' && (
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-semibold text-secondary">Jugador</label>
                        <select className="form-select form-select-sm" value={genJugId} onChange={(e) => setGenJugId(e.target.value)}>
                          <option value="">Seleccionar...</option>
                          {jugadores.filter((j) => j.activo).map((j) => (
                            <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-12 col-md-3 text-md-end">
                      <button className="btn btn-sm btn-success" disabled={generando} onClick={generarCuotas}>
                        {generando ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-magic me-1"></i>}
                        Generar cuotas
                      </button>
                    </div>
                  </div>
                  <div className="form-text small mt-2">
                    Genera cuotas de {MESES[Number(cfg.cuota_mes_inicio) - 1]} a {MESES[Number(cfg.cuota_mes_fin) - 1]} con vencimiento el día {cfg.cuota_dia_vencimiento} de cada mes.
                    Quien se dé de alta a mitad de año arranca desde su mes de alta; las cuotas ya existentes se saltan.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de pagos pendientes de confirmación */}
      {pendientesConfirmacion > 0 && (
        <div className="row g-4 mb-3">
          <div className="col-12">
            <div className="alert alert-info d-flex align-items-center mb-0" role="alert">
              <i className="bi bi-hourglass-split me-2 fs-5"></i>
              <div className="small">
                <b>{pendientesConfirmacion} pago(s) pendiente(s) de confirmación</b> — revisá el comprobante y confírmalos desde el listado.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de pendientes */}
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className={`alert d-flex align-items-center mb-0 ${pendientes.length ? 'alert-warning' : 'alert-success'}`} role="alert">
            <i className={`bi ${pendientes.length ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2 fs-5`}></i>
            <div className="small">
              <b>{MESES[mesRef - 1]} {anioRef}:</b>{' '}
              {pendientes.length === 0
                ? 'Todos los jugadores activos están al día.'
                : `${pendientes.length} jugador(es) pendiente(s): ${pendientes.map((j) => `${j.nombre} ${j.apellido}`).join(', ')}`}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-3 fw-bold">
                  <i className="bi bi-list-ul text-success me-2"></i> Historial de Pagos
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-9">
                  <div className="row g-2">
                    <div className="col-12 col-sm-4">
                      <select className="form-select form-select-sm" value={filtroJugador} onChange={(e) => setFiltroJugador(e.target.value)}>
                        <option value="">Todos los jugadores</option>
                        {jugadores.map((j) => (
                          <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-4 col-sm-3">
                      <select className="form-select form-select-sm" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
                        <option value="">Todos los meses</option>
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-4 col-sm-2">
                      <input type="number" className="form-control form-control-sm" placeholder="Año" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} />
                    </div>
                    <div className="col-4 col-sm-3">
                      <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="en_revision">En revisión</option>
                        <option value="confirmado">Pagados</option>
                        <option value="rechazado">Rechazados</option>
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
                    <th className="px-3">Jugador</th>
                    <th>Período</th>
                    <th>Vence</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-5">
                        No hay pagos que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((p) => (
                      <tr key={p.id} className={p.estado === 'en_revision' ? 'table-warning-subtle' : (p.estado === 'rechazado' || esVencida(p)) ? 'table-danger-subtle' : ''}>
                        <td className="px-3 fw-semibold">
                          {jugadorNombre(p.jugadorId)}
                          {p.registradoPor === 'padre' && <i className="bi bi-phone ms-1 text-muted" title="Informado por el padre"></i>}
                          {p.registradoPor === 'sistema' && <i className="bi bi-gear ms-1 text-muted" title="Cuota generada por el sistema"></i>}
                        </td>
                        <td><span className="badge bg-primary-subtle text-primary">{MESES[p.mes - 1]} {p.anio}</span></td>
                        <td className={esVencida(p) ? 'text-danger fw-semibold' : 'text-muted'}>{p.vencimiento ? fmtFecha(p.vencimiento) : '-'}</td>
                        <td className="fw-medium text-success">{formatGs(p.monto)}</td>
                        <td>{p.metodo || '-'}</td>
                        <td>
                          {esVencida(p) ? (
                            <span className="badge bg-danger-subtle text-danger-emphasis">Vencida</span>
                          ) : (
                            <span className={`badge ${ESTADO_BADGE[p.estado] || 'bg-secondary'}`}>{ESTADO_LABEL[p.estado] || p.estado}</span>
                          )}
                        </td>
                        <td className="small text-muted">
                          <div className="text-truncate" style={{ maxWidth: '200px' }}
                            title={`${p.nroComprobante ? `N° ${p.nroComprobante} · ` : ''}${p.remitente || ''} ${p.banco ? `(${p.banco})` : ''} · ${p.fechaPago}`}>
                            {p.nroComprobante && <>N° {p.nroComprobante} · </>}{p.remitente || p.fechaPago}
                          </div>
                        </td>
                        <td className="px-3 text-end">
                          {p.comprobanteUrl && (
                            <button className="btn btn-sm btn-outline-info me-1" onClick={() => verComprobante(p.id)} title="Ver comprobante">
                              <i className="bi bi-image"></i>
                            </button>
                          )}
                          {['pendiente', 'en_revision'].includes(p.estado) && (
                            <button
                              className="btn btn-sm btn-success me-1"
                              title={p.estado === 'en_revision' ? 'Confirmar pago' : 'Marcar cuota como pagada'}
                              onClick={async () => { if (await onConfirmar(p.id)) toast('Pago confirmado'); }}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}
                          {p.estado === 'en_revision' && (
                            <button
                              className="btn btn-sm btn-outline-warning me-1"
                              title="Rechazar"
                              onClick={async () => { if (await confirmar('¿Rechazar este comprobante?', 'El padre deberá reenviarlo.')) { if (await onRechazar(p.id)) toast('Pago rechazado', 'warning'); } }}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar('¿Eliminar este pago?')) await onDelete(p.id); }} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filtrados.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="2" className="px-3 fw-bold">Total confirmado</td>
                      <td colSpan="5" className="fw-bold text-success">{formatGs(totalFiltrado)}</td>
                    </tr>
                  </tfoot>
                )}
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
