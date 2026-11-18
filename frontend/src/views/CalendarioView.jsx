import React, { useState } from 'react';
import { CalendarioMes, TIPO_COLOR, TIPO_LABEL, MESES } from '../components/CalendarioMes';

const formatearFecha = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '-');

// Calendario del staff: entrenamientos recurrentes (días+horario de cada
// categoría) y eventos puntuales (torneos/amistosos/otros) en una grilla mensual.
export const CalendarioView = ({ categorias, entrenadores, torneos }) => {
  const [sel, setSel] = useState(null); // { fecha, chips }
  const [tipoFiltro, setTipoFiltro] = useState('');

  const chipsPara = (fecha) => {
    const dow = new Date(`${fecha}T12:00:00`).getDay();
    const chips = [];
    if (tipoFiltro === '' || tipoFiltro === 'entrenamiento') {
      categorias.forEach((c) => {
        const dias = c.dias?.length ? c.dias : [0, 1, 2, 3, 4, 5, 6];
        if (c.horaInicio && dias.includes(dow)) {
          chips.push({ tipo: 'entrenamiento', titulo: `${c.nombre} ${c.horaInicio}`, data: { ...c, tipoEvento: 'entrenamiento' } });
        }
      });
    }
    torneos
      .filter((t) => t.fecha?.slice(0, 10) === fecha)
      .forEach((t) => {
        if (tipoFiltro === '' || t.tipo === tipoFiltro) {
          chips.push({ tipo: t.tipo, titulo: `${t.horaInicio ? t.horaInicio + ' ' : ''}${t.nombre}`, data: { ...t, tipoEvento: t.tipo } });
        }
      });
    return chips;
  };

  const clicDia = (fecha) => setSel({ fecha, chips: chipsPara(fecha) });
  const entrenadorNombre = (id) => {
    const e = entrenadores.find((x) => x.id === Number(id));
    return e ? `${e.nombre} ${e.apellido}` : '-';
  };

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="small text-muted fw-semibold">Filtrar:</span>
            {['', 'entrenamiento', 'torneo', 'amistoso', 'evento'].map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${tipoFiltro === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setTipoFiltro(t)}
              >
                {t === '' ? 'Todo' : TIPO_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <CalendarioMes eventosPara={chipsPara} onDiaClick={clicDia} onEventoClick={(ev, fecha) => setSel({ fecha, chips: chipsPara(fecha) })} diaSeleccionado={sel?.fecha} />
        </div>
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-list-ul text-primary me-2"></i>
              {sel ? `${formatearFecha(sel.fecha)}` : 'Detalle del día'}
            </div>
            <div className="list-group list-group-flush">
              {!sel ? (
                <div className="list-group-item text-muted small py-4 text-center">
                  Tocá un día del calendario para ver sus actividades.
                </div>
              ) : sel.chips.length === 0 ? (
                <div className="list-group-item text-muted small py-4 text-center">Sin actividades este día.</div>
              ) : (
                sel.chips.map((ev, i) => (
                  <div key={i} className="list-group-item px-3 py-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`badge ${TIPO_COLOR[ev.tipo]}`}>{TIPO_LABEL[ev.tipo]}</span>
                      <span className="fw-semibold small">{ev.data.nombre}</span>
                    </div>
                    <div className="small text-muted">
                      {ev.tipo === 'entrenamiento' ? (
                        <>
                          <i className="bi bi-clock me-1"></i>{ev.data.horaInicio}{ev.data.horaFin ? ` – ${ev.data.horaFin}` : ''} hs
                          <span className="ms-2"><i className="bi bi-person-badge me-1"></i>{entrenadorNombre(ev.data.entrenadorId)}</span>
                        </>
                      ) : (
                        <>
                          {ev.data.horaInicio && <><i className="bi bi-clock me-1"></i>{ev.data.horaInicio}{ev.data.horaFin ? ` – ${ev.data.horaFin}` : ''} hs</>}
                          {ev.data.lugar && <span className="ms-2"><i className="bi bi-geo-alt me-1"></i>{ev.data.lugar}</span>}
                          {ev.data.categoriaId && <span className="ms-2"><i className="bi bi-diagram-3 me-1"></i>{categorias.find((c) => c.id === ev.data.categoriaId)?.nombre}</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
