import React, { useState } from 'react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const TIPO_COLOR = {
  entrenamiento: 'bg-primary-subtle text-primary-emphasis',
  torneo: 'bg-warning-subtle text-warning-emphasis',
  amistoso: 'bg-success-subtle text-success-emphasis',
  evento: 'bg-secondary-subtle text-secondary-emphasis',
};

export const TIPO_LABEL = {
  entrenamiento: 'Entrenamiento', torneo: 'Torneo', amistoso: 'Amistoso', evento: 'Evento',
};

// Barra lateral del bloque en el detalle del día (mismo color que el badge)
const TIPO_BARRA = {
  entrenamiento: 'bg-primary', torneo: 'bg-warning',
  amistoso: 'bg-success', evento: 'bg-secondary',
};

const fmtFecha = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '-');

export const aAAA_MM_DD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const lunesDeSemana = (d) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Detalle del día como timeline vertical: los bloques se agrupan por hora de
// inicio y se apilan uno debajo del otro cuando comparten horario.
// extra(ev) → nodo extra en la línea de info; acciones(ev) → nodo bajo el bloque.
export const DetalleDia = ({ fecha, chips, extra, acciones }) => {
  const grupos = new Map();
  chips.forEach((ev) => {
    const h = ev.data?.horaInicio || '';
    if (!grupos.has(h)) grupos.set(h, []);
    grupos.get(h).push(ev);
  });
  const horas = [...grupos.keys()].sort();

  return (
    <div className="card shadow-sm border-0" key={fecha} style={{ animation: 'detalleDiaIn .25s ease-out' }}>
      <style>{'@keyframes detalleDiaIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }'}</style>
      <div className="card-header bg-white py-2 fw-bold border-bottom small">
        <i className="bi bi-list-ul text-primary me-2"></i>{fmtFecha(fecha)}
      </div>
      <div className="card-body p-2">
        {chips.length === 0 ? (
          <div className="text-muted small py-4 text-center">Sin actividades este día.</div>
        ) : (
          horas.map((h) => (
            <div key={h || 'sin-hora'} className="d-flex">
              <div className="text-end text-muted fw-semibold small pe-2 flex-shrink-0" style={{ width: '52px' }}>
                {h || '—'}
              </div>
              <div className="flex-fill border-start ps-3 pb-2 position-relative">
                <span
                  className="position-absolute rounded-circle bg-white border border-2 d-flex align-items-center justify-content-center"
                  style={{ width: '14px', height: '14px', left: '-8px', top: '3px', borderColor: '#adb5bd' }}
                >
                  <span className="rounded-circle" style={{ width: '4px', height: '4px', backgroundColor: '#adb5bd' }}></span>
                </span>
                {grupos.get(h).map((ev, i) => (
                  <div key={i} className="d-flex rounded border bg-white mb-2 overflow-hidden">
                    <div className={`${TIPO_BARRA[ev.tipo] || TIPO_BARRA.evento} flex-shrink-0`} style={{ width: '4px' }}></div>
                    <div className="flex-fill p-2">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge ${TIPO_COLOR[ev.tipo]}`}>{TIPO_LABEL[ev.tipo]}</span>
                        <span className="fw-semibold small">{ev.data.nombre}</span>
                      </div>
                      <div className="small text-muted">
                        {ev.data.horaInicio && (
                          <><i className="bi bi-clock me-1"></i>{ev.data.horaInicio}{ev.data.horaFin ? ` – ${ev.data.horaFin}` : ''} hs</>
                        )}
                        {ev.data.lugar && <span className="ms-2"><i className="bi bi-geo-alt me-1"></i>{ev.data.lugar}</span>}
                        {extra?.(ev)}
                      </div>
                      {acciones?.(ev)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Chips de eventos dentro de una celda del calendario
const Chips = ({ chips, fecha, onEventoClick, max = 2 }) => (
  <>
    {chips.slice(0, max).map((ev, j) => (
      <div
        key={j}
        className={`badge d-block text-truncate mb-1 fw-normal ${TIPO_COLOR[ev.tipo] || TIPO_COLOR.evento}`}
        style={{ cursor: 'pointer' }}
        title={ev.titulo}
        onClick={(e) => { e.stopPropagation(); onEventoClick?.(ev, fecha); }}
      >
        {ev.titulo}
      </div>
    ))}
    {chips.length > max && <div className="text-muted" style={{ fontSize: '10px' }}>+{chips.length - max} más</div>}
  </>
);

// Calendario multi-vista compartido (staff y padres): Mes / Semana / Día / Lista.
// eventosPara(fecha 'YYYY-MM-DD') → [{ tipo, titulo, data }]
// onEventoClick(evento, fecha) — clic en un chip; onDiaClick(fecha) — día mostrado/seleccionado
// detalleExtra(ev), detalleAcciones(ev) → se pasan a DetalleDia en la vista Día
export const Calendario = ({ eventosPara, onEventoClick, onDiaClick, diaSeleccionado, vista, onVistaChange, detalleExtra, detalleAcciones }) => {
  const hoyStr = aAAA_MM_DD(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const cursorStr = aAAA_MM_DD(cursor);

  const seleccionarFecha = (fecha) => {
    setCursor(new Date(`${fecha}T12:00:00`));
    onDiaClick?.(fecha);
  };

  const cambiarVista = (v) => {
    onVistaChange?.(v);
    if (v === 'dia') onDiaClick?.(cursorStr);
  };

  const mover = (delta) => {
    const d = new Date(cursor);
    if (vista === 'mes' || vista === 'lista') d.setMonth(d.getMonth() + delta, 1);
    else if (vista === 'semana') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    setCursor(d);
    if (vista === 'dia') onDiaClick?.(aAAA_MM_DD(d));
  };

  const irHoy = () => {
    setCursor(new Date());
    if (vista === 'dia') onDiaClick?.(hoyStr);
  };

  const lunes = lunesDeSemana(cursor);
  const domingo = addDias(lunes, 6);
  const titulo =
    vista === 'semana'
      ? `${lunes.getDate()} – ${domingo.getDate()} ${MESES[domingo.getMonth()]} ${domingo.getFullYear()}`
      : vista === 'dia'
        ? `${DIAS_LARGO[cursor.getDay()]} ${fmtFecha(cursorStr)}`
        : `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const vistaMes = () => {
    const anio = cursor.getFullYear();
    const mes = cursor.getMonth();
    const offset = (new Date(anio, mes, 1).getDay() + 6) % 7; // semana empieza en lunes
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const celdas = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
    while (celdas.length % 7) celdas.push(null);

    return (
      <>
        <div className="d-grid text-center small fw-semibold text-muted mb-1" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {DIAS_SEMANA.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} style={{ height: '84px' }}></div>;
            const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const chips = eventosPara ? eventosPara(fecha) : [];
            const esHoy = fecha === hoyStr;
            const sel = fecha === diaSeleccionado;
            return (
              <div
                key={i}
                className={`border rounded p-1 m-0 ${esHoy ? 'border-primary' : ''} ${sel ? 'bg-light' : ''}`}
                style={{ height: '84px', overflow: 'hidden', cursor: 'pointer', fontSize: '11px' }}
                onClick={() => seleccionarFecha(fecha)}
              >
                <div className={`fw-semibold ${esHoy ? 'text-primary' : 'text-muted'}`}>{dia}</div>
                <Chips chips={chips} fecha={fecha} onEventoClick={onEventoClick} />
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const vistaSemana = () => {
    const dias = Array.from({ length: 7 }, (_, i) => addDias(lunes, i));
    return (
      <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
        {dias.map((d, i) => {
          const fecha = aAAA_MM_DD(d);
          const chips = eventosPara ? eventosPara(fecha) : [];
          const esHoy = fecha === hoyStr;
          const sel = fecha === diaSeleccionado;
          return (
            <div
              key={i}
              className={`border rounded p-1 m-0 ${esHoy ? 'border-primary' : ''} ${sel ? 'bg-light' : ''}`}
              style={{ minHeight: '130px', overflow: 'hidden', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => seleccionarFecha(fecha)}
            >
              <div className={`fw-semibold mb-1 ${esHoy ? 'text-primary' : 'text-muted'}`}>
                {DIAS_SEMANA[i]} {d.getDate()}
              </div>
              <Chips chips={chips} fecha={fecha} onEventoClick={onEventoClick} max={4} />
            </div>
          );
        })}
      </div>
    );
  };

  const vistaLista = () => {
    const anio = cursor.getFullYear();
    const mes = cursor.getMonth();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const grupos = [];
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const chips = [...(eventosPara ? eventosPara(fecha) : [])]
        .sort((a, b) => (a.data?.horaInicio || '99').localeCompare(b.data?.horaInicio || '99'));
      if (chips.length) grupos.push({ fecha, chips });
    }
    if (!grupos.length) {
      return <div className="text-muted small py-4 text-center">Sin actividades este mes.</div>;
    }
    return grupos.map(({ fecha, chips }) => {
      const d = new Date(`${fecha}T12:00:00`);
      return (
        <div key={fecha} className="mb-3">
          <div className="small fw-bold text-muted border-bottom pb-1 mb-1">
            {DIAS_LARGO[d.getDay()]} {fmtFecha(fecha)}
          </div>
          {chips.map((ev, i) => (
            <div
              key={i}
              className="d-flex align-items-center gap-2 py-2 border-bottom"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setCursor(new Date(`${fecha}T12:00:00`));
                onVistaChange?.('dia');
                onDiaClick?.(fecha);
              }}
            >
              <span className={`badge ${TIPO_COLOR[ev.tipo]} flex-shrink-0`} style={{ minWidth: '92px' }}>
                {TIPO_LABEL[ev.tipo]}
              </span>
              <span className="small fw-semibold flex-fill text-truncate">{ev.data.nombre}</span>
              <span className="small text-muted text-nowrap">
                {ev.data.horaInicio ? `${ev.data.horaInicio}${ev.data.horaFin ? `–${ev.data.horaFin}` : ''}` : ''}
              </span>
              {ev.data.lugar && (
                <span className="small text-muted text-nowrap d-none d-sm-inline">
                  <i className="bi bi-geo-alt me-1"></i>{ev.data.lugar}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-2 border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-1">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => mover(-1)} title="Anterior">
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={irHoy}>Hoy</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => mover(1)} title="Siguiente">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          <span className="fw-bold">{titulo}</span>
          <div className="btn-group btn-group-sm">
            {[['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día'], ['lista', 'Lista']].map(([v, l]) => (
              <button
                key={v}
                className={`btn ${vista === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => cambiarVista(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`card-body ${vista === 'dia' ? 'p-0' : 'p-2'}`}>
        {vista === 'mes' && vistaMes()}
        {vista === 'semana' && vistaSemana()}
        {vista === 'lista' && vistaLista()}
        {vista === 'dia' && (
          <DetalleDia
            fecha={cursorStr}
            chips={eventosPara ? eventosPara(cursorStr) : []}
            extra={detalleExtra}
            acciones={detalleAcciones}
          />
        )}
      </div>
    </div>
  );
};
