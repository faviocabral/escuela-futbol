import React, { useState } from 'react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
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

export const aAAA_MM_DD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Calendario mensual compartido (staff y padres).
// eventosPara(fecha 'YYYY-MM-DD') → [{ tipo, titulo, data }]
// onEventoClick(evento) — clic en un chip; onDiaClick(fecha) — clic en el día
export const CalendarioMes = ({ eventosPara, onEventoClick, onDiaClick, diaSeleccionado }) => {
  const hoyStr = aAAA_MM_DD(new Date());
  const [cursor, setCursor] = useState(() => {
    const h = new Date();
    return { anio: h.getFullYear(), mes: h.getMonth() };
  });

  const mover = (delta) =>
    setCursor((c) => {
      const m = c.mes + delta;
      return { anio: c.anio + Math.floor(m / 12), mes: ((m % 12) + 12) % 12 };
    });

  const { anio, mes } = cursor;
  const primero = new Date(anio, mes, 1);
  const offset = (primero.getDay() + 6) % 7; // semana empieza en lunes
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-2 border-bottom d-flex justify-content-between align-items-center">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => mover(-1)}>
          <i className="bi bi-chevron-left"></i>
        </button>
        <span className="fw-bold">{MESES[mes]} {anio}</span>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => mover(1)}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
      <div className="card-body p-2">
        <div className="d-grid text-center small fw-semibold text-muted mb-1" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {DIAS_SEMANA.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} className="border-0" style={{ minHeight: '62px' }}></div>;
            const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const chips = eventosPara ? eventosPara(fecha) : [];
            const esHoy = fecha === hoyStr;
            const sel = fecha === diaSeleccionado;
            return (
              <div
                key={i}
                className={`border rounded p-1 m-0 ${esHoy ? 'border-primary' : ''} ${sel ? 'bg-light' : ''}`}
                style={{ minHeight: '62px', cursor: 'pointer', fontSize: '11px' }}
                onClick={() => onDiaClick?.(fecha)}
              >
                <div className={`fw-semibold ${esHoy ? 'text-primary' : 'text-muted'}`}>{dia}</div>
                {chips.slice(0, 2).map((ev, j) => (
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
                {chips.length > 2 && <div className="text-muted" style={{ fontSize: '10px' }}>+{chips.length - 2} más</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
