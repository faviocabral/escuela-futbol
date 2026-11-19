import React, { useEffect, useRef, useState } from 'react';
import { Calendario, DetalleDia, TIPO_LABEL } from '../components/CalendarioMes';

// Calendario del staff: entrenamientos recurrentes (días+horario de cada
// categoría) y eventos puntuales (torneos/amistosos/otros) en una grilla mensual.
export const CalendarioView = ({ categorias, entrenadores, torneos }) => {
  const [selFecha, setSelFecha] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [vistaCal, setVistaCal] = useState('mes');
  const detalleRef = useRef(null);

  // En mobile el detalle queda bajo el calendario → scroll suave hasta él
  useEffect(() => {
    const el = detalleRef.current;
    if (selFecha && el && el.getBoundingClientRect().top > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selFecha]);

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
        <div className={`col-12 ${['mes', 'semana'].includes(vistaCal) ? 'col-lg-8' : ''}`}>
          <Calendario
            eventosPara={chipsPara}
            onDiaClick={setSelFecha}
            onEventoClick={(ev, fecha) => setSelFecha(fecha)}
            diaSeleccionado={selFecha}
            vista={vistaCal}
            onVistaChange={setVistaCal}
            detalleExtra={(ev) =>
              ev.tipo === 'entrenamiento' ? (
                <span className="ms-2"><i className="bi bi-person-badge me-1"></i>{entrenadorNombre(ev.data.entrenadorId)}</span>
              ) : ev.data.categoriaId ? (
                <span className="ms-2"><i className="bi bi-diagram-3 me-1"></i>{categorias.find((c) => c.id === ev.data.categoriaId)?.nombre}</span>
              ) : null
            }
          />
        </div>
        {['mes', 'semana'].includes(vistaCal) && (
          <div className="col-12 col-lg-4">
            {!selFecha ? (
              <div className="card shadow-sm border-0">
                <div className="card-body text-muted small py-4 text-center">
                  Tocá un día del calendario para ver sus actividades.
                </div>
              </div>
            ) : (
              <div ref={detalleRef} style={{ scrollMarginTop: '72px' }}>
                <DetalleDia
                  fecha={selFecha}
                  chips={chipsPara(selFecha)}
                  extra={(ev) =>
                    ev.tipo === 'entrenamiento' ? (
                      <span className="ms-2"><i className="bi bi-person-badge me-1"></i>{entrenadorNombre(ev.data.entrenadorId)}</span>
                    ) : ev.data.categoriaId ? (
                      <span className="ms-2"><i className="bi bi-diagram-3 me-1"></i>{categorias.find((c) => c.id === ev.data.categoriaId)?.nombre}</span>
                    ) : null
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
