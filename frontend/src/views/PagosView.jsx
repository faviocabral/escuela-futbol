import React, { useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTO_MENSUALIDAD = 150000;

const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;

export const PagosView = ({ pagos, jugadores, categorias, onAdd, onDelete }) => {
  const hoy = new Date();
  const [jugadorId, setJugadorId] = useState('');
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [monto, setMonto] = useState(MONTO_MENSUALIDAD);
  const [metodo, setMetodo] = useState('Efectivo');

  const [filtroJugador, setFiltroJugador] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');

  const jugadorNombre = (id) => {
    const j = jugadores.find((x) => x.id === id);
    return j ? `${j.nombre} ${j.apellido}` : `#${id}`;
  };
  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || '-';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jugadorId) return aviso('Selecciona el jugador.');
    if (Number(monto) <= 0) return aviso('El monto debe ser mayor a 0.');

    const duplicado = pagos.find(
      (p) => p.jugadorId === Number(jugadorId) && p.mes === Number(mes) && p.anio === Number(anio)
    );
    if (duplicado) return aviso(`Ya existe un pago registrado para ${jugadorNombre(Number(jugadorId))} en ${MESES[mes - 1]} ${anio}.`);

    onAdd({
      jugadorId: Number(jugadorId),
      mes: Number(mes),
      anio: Number(anio),
      monto: Number(monto),
      metodo,
      fechaPago: hoy.toISOString().slice(0, 10),
    });
    toast('Pago registrado');
    setJugadorId('');
  };

  const filtrados = pagos
    .filter((p) =>
      (filtroJugador === '' || p.jugadorId === Number(filtroJugador)) &&
      (filtroMes === '' || p.mes === Number(filtroMes)) &&
      (filtroAnio === '' || p.anio === Number(filtroAnio))
    )
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes || b.fechaPago.localeCompare(a.fechaPago));

  const pag = usePaginacion(filtrados.length);

  // Pendientes del mes/año filtrado (o el actual si no hay filtro)
  const mesRef = filtroMes === '' ? hoy.getMonth() + 1 : Number(filtroMes);
  const anioRef = filtroAnio === '' ? hoy.getFullYear() : Number(filtroAnio);
  const pendientes = jugadores
    .filter((j) => j.activo)
    .filter((j) => !pagos.some((p) => p.jugadorId === j.id && p.mes === mesRef && p.anio === anioRef));

  const totalFiltrado = filtrados.reduce((acc, p) => acc + Number(p.monto), 0);

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
                <div className="col-12 col-md-4 fw-bold">
                  <i className="bi bi-list-ul text-success me-2"></i> Historial de Pagos
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-8">
                  <div className="row g-2">
                    <div className="col-12 col-sm-5">
                      <select className="form-select form-select-sm" value={filtroJugador} onChange={(e) => setFiltroJugador(e.target.value)}>
                        <option value="">Todos los jugadores</option>
                        {jugadores.map((j) => (
                          <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-sm-4">
                      <select className="form-select form-select-sm" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
                        <option value="">Todos los meses</option>
                        {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-sm-3">
                      <input type="number" className="form-control form-control-sm" placeholder="Año" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} />
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
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Fecha de pago</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-5">
                        No hay pagos que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 fw-semibold">{jugadorNombre(p.jugadorId)}</td>
                        <td><span className="badge bg-primary-subtle text-primary">{MESES[p.mes - 1]} {p.anio}</span></td>
                        <td className="fw-medium text-success">{formatGs(p.monto)}</td>
                        <td>{p.metodo}</td>
                        <td>{p.fechaPago}</td>
                        <td className="px-3 text-end">
                          <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar('¿Eliminar este pago?')) onDelete(p.id); }} title="Eliminar">
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
                      <td colSpan="2" className="px-3 fw-bold">Total recaudado</td>
                      <td colSpan="4" className="fw-bold text-success">{formatGs(totalFiltrado)}</td>
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
