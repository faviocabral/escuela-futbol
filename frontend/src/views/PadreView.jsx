import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { Avatar } from '../components/Avatar';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, toast } from '../utils/notify';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatGs = (n) => `Gs. ${Number(n || 0).toLocaleString('es-PY')}`;
const formatearFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '-');

const ESTADO_BADGE = {
  pendiente: 'bg-warning-subtle text-warning-emphasis',
  confirmado: 'bg-success-subtle text-success-emphasis',
  rechazado: 'bg-danger-subtle text-danger-emphasis',
};

// ── Tab: Asistencia ─────────────────────────────────────────
const TabAsistencia = ({ jugador, asistencias, onMarcar }) => {
  const [motivo, setMotivo] = useState('');
  const [modo, setModo] = useState(null); // 'presente' | 'ausente'
  const [enviando, setEnviando] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);
  const marcaHoy = asistencias.find((a) => a.fecha === hoy && a.tipo === 'entrenamiento');
  const pag = usePaginacion(asistencias.length);

  const marcar = async (estado) => {
    if (estado === 'ausente' && !motivo.trim()) return aviso('Contanos el motivo de la ausencia.');
    setEnviando(true);
    try {
      await onMarcar(estado, estado === 'ausente' ? motivo.trim() : null);
      setModo(null);
      setMotivo('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3 mb-3">
            <Avatar jugador={jugador} size={56} />
            <div>
              <div className="fw-bold">{jugador.nombre} {jugador.apellido}</div>
              <div className="small text-muted">{jugador.categoriaNombre} · Hoy {formatearFecha(hoy)}</div>
            </div>
          </div>

          {marcaHoy ? (
            <div className={`alert mb-2 py-2 small ${marcaHoy.presente ? 'alert-success' : 'alert-warning'}`}>
              <i className={`bi ${marcaHoy.presente ? 'bi-check-circle' : 'bi-exclamation-circle'} me-1`}></i>
              {marcaHoy.presente
                ? 'Ya figura como presente hoy.'
                : <>Marcado como <b>ausente</b>{marcaHoy.motivoAusencia ? `: ${marcaHoy.motivoAusencia}` : ''}</>}
            </div>
          ) : (
            <p className="small text-muted">¿{jugador.nombre} asistió al entrenamiento de hoy?</p>
          )}

          <div className="d-grid gap-2">
            <button
              className="btn btn-success fw-semibold"
              disabled={enviando || marcaHoy?.presente}
              onClick={() => marcar('presente')}
            >
              <i className="bi bi-check2-circle me-1"></i> Asistió hoy
            </button>
            {modo === 'ausente' ? (
              <div className="border rounded p-3 bg-light">
                <label className="form-label small fw-semibold text-secondary">Motivo de la ausencia *</label>
                <textarea
                  className="form-control mb-2" rows="2" autoFocus
                  placeholder="Ej: está con fiebre, viaje familiar..."
                  value={motivo} onChange={(e) => setMotivo(e.target.value)}
                />
                <div className="d-flex gap-2">
                  <button className="btn btn-danger flex-fill" disabled={enviando} onClick={() => marcar('ausente')}>
                    <i className="bi bi-x-circle me-1"></i> Confirmar ausencia
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => setModo(null)}>Volver</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-outline-danger" disabled={enviando} onClick={() => setModo('ausente')}>
                <i className="bi bi-x-circle me-1"></i> No asistirá — justificar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 fw-bold border-bottom">
          <i className="bi bi-clock-history text-primary me-2"></i> Historial
        </div>
        <div className="list-group list-group-flush">
          {asistencias.length === 0 && (
            <div className="list-group-item text-muted text-center py-4 small">Sin registros todavía.</div>
          )}
          {pag.cortar(asistencias).map((a, i) => (
            <div key={i} className="list-group-item px-3 py-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium small">{formatearFecha(a.fecha)} <span className="text-muted">· {a.torneo || 'Entrenamiento'}</span></span>
                <span className={`badge ${a.presente ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                  {a.presente ? 'Presente' : 'Ausente'}
                </span>
              </div>
              {a.motivoAusencia && <div className="small text-muted mt-1"><i className="bi bi-chat-left-text me-1"></i>{a.motivoAusencia}</div>}
            </div>
          ))}
        </div>
        <Paginador
          pagina={pag.pagina} totalPaginas={pag.totalPaginas} onChange={pag.setPagina}
          porPagina={pag.porPagina} onPorPagina={pag.cambiarPorPagina}
          desde={pag.desde} hasta={pag.hasta} total={asistencias.length}
        />
      </div>
    </>
  );
};

// ── Tab: Pagos ──────────────────────────────────────────────
const TabPagos = ({ jugador, pagos, onPagoSubido }) => {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [extraido, setExtraido] = useState(null);
  const fileRef = useRef(null);
  const pag = usePaginacion(pagos.length);

  const enviar = async (e) => {
    e.preventDefault();
    if (!archivo) return aviso('Subí la foto del comprobante de transferencia.');
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('comprobante', archivo);
      fd.append('mes', mes);
      fd.append('anio', anio);
      if (monto) fd.append('monto', monto);
      const data = await apiFetch('/api/padre/pago', { method: 'POST', body: fd });
      setExtraido(data.extraido);
      toast('Comprobante enviado — pendiente de confirmación');
      setArchivo(null);
      if (fileRef.current) fileRef.current.value = '';
      onPagoSubido(data.pago);
    } catch (err) {
      aviso(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const verComprobante = async (pagoId) => {
    try {
      const { url } = await apiFetch(`/api/pagos/${pagoId}/comprobante`);
      window.open(url, '_blank');
    } catch (err) {
      aviso(err.message, 'error');
    }
  };

  const yaTienePago = pagos.some((p) => p.mes === Number(mes) && p.anio === Number(anio) && p.estado !== 'rechazado');

  return (
    <>
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white py-3 fw-bold border-bottom">
          <i className="bi bi-credit-card text-primary me-2"></i> Informar pago por transferencia
        </div>
        <div className="card-body">
          <form onSubmit={enviar}>
            <div className="row g-3">
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Mes *</label>
                <select className="form-select" value={mes} onChange={(e) => setMes(e.target.value)}>
                  {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Año *</label>
                <input type="number" className="form-control" value={anio} onChange={(e) => setAnio(e.target.value)} min="2020" max="2100" />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Monto (Gs.)</label>
                <input type="number" className="form-control" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Opcional" min="0" step="1000" />
              </div>
              <div className="col-12">
                <input ref={fileRef} type="file" className="d-none" accept="image/*" onChange={(e) => setArchivo(e.target.files[0] || null)} />
                <button type="button" className="btn btn-outline-primary w-100" onClick={() => fileRef.current?.click()}>
                  <i className="bi bi-camera me-1"></i>
                  {archivo ? archivo.name : 'Subir foto del comprobante *'}
                </button>
                <div className="form-text small">La escuela lo lee automáticamente y lo confirma.</div>
              </div>
              {yaTienePago && (
                <div className="col-12">
                  <div className="alert alert-warning py-2 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Ya hay un pago vigente para {MESES[mes - 1]} {anio}.
                  </div>
                </div>
              )}
              <div className="col-12">
                <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={enviando || yaTienePago}>
                  {enviando ? <><span className="spinner-border spinner-border-sm me-2"></span>Enviando...</> : 'Enviar comprobante'}
                </button>
              </div>
            </div>
          </form>

          {extraido && (
            <div className="alert alert-success small mt-3 mb-0">
              <b><i className="bi bi-check-circle me-1"></i>Datos leídos del comprobante:</b>
              <div className="mt-1">
                {extraido.monto != null && <div>Monto: <b>{formatGs(extraido.monto)}</b></div>}
                {extraido.fecha && <div>Fecha: {formatearFecha(extraido.fecha)}</div>}
                {extraido.nro_comprobante && <div>Comprobante: {extraido.nro_comprobante}</div>}
                {extraido.banco_origen && <div>Desde: {extraido.remitente || '-'} ({extraido.banco_origen})</div>}
                {extraido.banco_destino && <div>Hacia: {extraido.destinatario || '-'} ({extraido.banco_destino})</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 fw-bold border-bottom">
          <i className="bi bi-receipt text-success me-2"></i> Mis pagos
        </div>
        <div className="list-group list-group-flush">
          {pagos.length === 0 && (
            <div className="list-group-item text-muted text-center py-4 small">Todavía no registraste pagos.</div>
          )}
          {pag.cortar(pagos).map((p) => (
            <div key={p.id} className="list-group-item px-3 py-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium">{MESES[p.mes - 1]} {p.anio}</span>
                <span className={`badge ${ESTADO_BADGE[p.estado] || 'bg-secondary'}`}>{p.estado}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-1">
                <span className="small text-success fw-semibold">{formatGs(p.monto)}</span>
                <span className="small text-muted">{p.metodo}</span>
              </div>
              {(p.nroComprobante || p.banco) && (
                <div className="small text-muted mt-1">
                  {p.nroComprobante && <>N° {p.nroComprobante} · </>}{p.banco}
                </div>
              )}
              {p.comprobanteUrl && (
                <button className="btn btn-link btn-sm p-0 small" onClick={() => verComprobante(p.id)}>
                  <i className="bi bi-image me-1"></i>Ver comprobante
                </button>
              )}
            </div>
          ))}
        </div>
        <Paginador
          pagina={pag.pagina} totalPaginas={pag.totalPaginas} onChange={pag.setPagina}
          porPagina={pag.porPagina} onPorPagina={pag.cambiarPorPagina}
          desde={pag.desde} hasta={pag.hasta} total={pagos.length}
        />
      </div>
    </>
  );
};

// ── Tab: Mi Jugador ─────────────────────────────────────────
const StatItem = ({ valor, label }) => (
  <div className="flex-fill text-center px-2" style={{ borderRight: '1px solid rgba(255,255,255,.25)' }}>
    <div className="fw-bold fs-5">{valor}</div>
    <div className="small" style={{ fontSize: '11px', opacity: 0.85 }}>{label}</div>
  </div>
);

const InfoRow = ({ icon, label, valor }) => (
  <div className="d-flex align-items-center py-3 border-bottom">
    <i className={`bi ${icon} text-success fs-5 me-3`} style={{ width: '22px' }}></i>
    <span className="text-secondary small flex-fill">{label}</span>
    <span className="fw-medium small text-end">{valor}</span>
  </div>
);

const TabJugador = ({ jugador, asistencias, pagos }) => {
  const presentes = asistencias.filter((a) => a.presente).length;
  const ausentes = asistencias.filter((a) => !a.presente).length;
  const pagosOk = pagos.filter((p) => p.estado === 'confirmado').length;

  return (
    <>
      <div className="text-center pt-2 pb-3">
        <div className="d-flex justify-content-center">
          <Avatar jugador={jugador} size={104} />
        </div>
        <h5 className="mt-3 mb-0 fw-bold">{jugador.nombre} {jugador.apellido}</h5>
        <div className="text-muted small">{jugador.categoriaNombre}</div>
      </div>

      <div
        className="d-flex rounded-3 shadow-sm mx-2 mb-4 py-3 text-white"
        style={{ background: 'linear-gradient(135deg, #3aa381, #2e8b6d)' }}
      >
        <StatItem valor={presentes} label="Presentes" />
        <StatItem valor={ausentes} label="Ausentes" />
        <div className="flex-fill text-center px-2">
          <div className="fw-bold fs-5">{pagosOk}</div>
          <div className="small" style={{ fontSize: '11px', opacity: 0.85 }}>Pagos confirmados</div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mx-2">
        <div className="card-body px-3 py-1">
          <InfoRow icon="bi-card-text" label="Documento" valor={jugador.documento || '-'} />
          <InfoRow icon="bi-calendar-event" label="Nacimiento" valor={formatearFecha(jugador.fechaNacimiento?.slice(0, 10))} />
          <InfoRow icon="bi-person" label="Tutor" valor={jugador.tutor || '-'} />
          <InfoRow icon="bi-telephone" label="Teléfono" valor={jugador.telefonoTutor || '-'} />
          <div className="d-flex align-items-center py-3">
            <i className="bi bi-check-circle text-success fs-5 me-3" style={{ width: '22px' }}></i>
            <span className="text-secondary small flex-fill">Estado</span>
            <span className={`badge ${jugador.activo ? 'bg-success' : 'bg-secondary'}`}>
              {jugador.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Portal principal ────────────────────────────────────────
export default function PadreView({ usuario, onLogout }) {
  const [vista, setVista] = useState('asistencia');
  const [jugador, setJugador] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [j, a, p] = await Promise.all([
          apiFetch('/api/padre/jugador'),
          apiFetch('/api/padre/asistencias'),
          apiFetch('/api/padre/pagos'),
        ]);
        setJugador(j);
        setAsistencias(a);
        setPagos(p);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  const marcar = async (estado, motivo) => {
    try {
      const r = await apiFetch('/api/padre/asistencia', {
        method: 'POST',
        body: JSON.stringify({ estado, motivo }),
      });
      if (r.resultado === 'ya_marcado') aviso('Ya estaba marcado como presente.');
      else toast(estado === 'presente' ? 'Asistencia registrada' : 'Ausencia justificada');
      setAsistencias(await apiFetch('/api/padre/asistencias'));
    } catch (e) {
      aviso(e.message, 'error');
    }
  };

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
        <div className="card shadow-sm border-0 p-4 text-center" style={{ maxWidth: '360px' }}>
          <i className="bi bi-exclamation-triangle text-warning fs-1 mb-3"></i>
          <p className="small text-muted">{error}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  if (!jugador) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const TABS = [
    { id: 'asistencia', icon: 'bi-check2-square', label: 'Asistencia' },
    { id: 'pagos', icon: 'bi-credit-card', label: 'Pagos' },
    { id: 'jugador', icon: 'bi-person', label: 'Mi jugador' },
  ];

  return (
    <div className="bg-light min-vh-100 pb-5">
      <nav className="navbar sticky-top bg-white shadow-sm px-3">
        <span className="navbar-brand mb-0 fw-bold text-dark">
          <i className="bi bi-trophy-fill text-success me-2"></i>Escuela de Fútbol
        </span>
        <button className="btn btn-sm btn-outline-secondary" onClick={onLogout} title="Cerrar sesión">
          <i className="bi bi-box-arrow-right me-1"></i>Salir
        </button>
      </nav>

      <div className="container py-3" style={{ maxWidth: '560px' }}>
        {vista === 'asistencia' && <TabAsistencia jugador={jugador} asistencias={asistencias} onMarcar={marcar} />}
        {vista === 'pagos' && <TabPagos jugador={jugador} pagos={pagos} onPagoSubido={(p) => setPagos((prev) => [p, ...prev])} />}
        {vista === 'jugador' && <TabJugador jugador={jugador} asistencias={asistencias} pagos={pagos} />}
      </div>

      {/* Navegación inferior fija — pensada para celular */}
      <nav className="navbar fixed-bottom bg-white border-top shadow-sm p-0">
        <div className="d-flex w-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn flex-fill rounded-0 py-2 small ${vista === t.id ? 'text-primary fw-bold' : 'text-secondary'}`}
              onClick={() => setVista(t.id)}
            >
              <i className={`bi ${t.icon} d-block fs-5`}></i>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
