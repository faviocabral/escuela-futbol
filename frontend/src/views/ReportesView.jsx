import React, { useEffect, useMemo, useRef, useState } from 'react';
import $ from './pivotSetup'; // expone window.jQuery ANTES de jQuery UI
// pivotUI necesita jQuery UI (sortable) para el drag&drop de campos
import 'jquery-ui-dist/jquery-ui.min.js';
import 'pivottable/dist/pivot.min.js';
import 'pivottable/dist/pivot.es.min.js';
import 'pivottable/dist/pivot.min.css';

// Reportes con PivotTable.js: tablas dinámicas drag&drop sobre los datos
// ya cargados en el store (no hace falta endpoint extra).
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIPO_LABEL = { entrenamiento: 'Entrenamiento', torneo: 'Torneo', amistoso: 'Amistoso', evento: 'Evento' };
const ESTADO_PAGO = { pendiente: 'Pendiente', en_revision: 'En revisión', confirmado: 'Pagado', rechazado: 'Rechazado' };

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const edadDe = (fn) => {
  if (!fn) return '-';
  const n = new Date(`${String(fn).slice(0, 10)}T12:00:00`);
  const h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
};

const tpl = $.pivotUtilities.aggregatorTemplates;
const LOC = $.pivotUtilities.locales.es;
const fmtGs = $.pivotUtilities.numberFormat({
  digitsAfterDecimal: 0, thousandsSep: '.', decimalSep: ',', prefix: 'Gs. ',
});

// Agregadores disponibles en el desplegable del pivot (en español)
const AGGREGATORS = {
  'Cantidad': () => LOC.aggregators['Cuenta']([]),
  'Jugadores únicos': () => LOC.aggregators['Cuenta de valores únicos'](['Jugador']),
  'Suma (Gs.)': () => tpl.sum(fmtGs)(['Monto']),
  'Promedio (Gs.)': () => tpl.average(fmtGs)(['Monto']),
};

const RENDERERS = {
  'Tabla': $.pivotUtilities.renderers['Table'],
  'Tabla con barras': $.pivotUtilities.renderers['Table Barchart'],
  'Mapa de calor': $.pivotUtilities.renderers['Heatmap'],
  'Calor por filas': $.pivotUtilities.renderers['Row Heatmap'],
  'Calor por columnas': $.pivotUtilities.renderers['Col Heatmap'],
};

const mesDe = (fecha) => MESES[Number(String(fecha).slice(5, 7)) - 1] || '-';
const anioDe = (fecha) => String(fecha).slice(0, 4);

export const ReportesView = ({ jugadores, categorias, torneos, convocatorias, asistencias, pagos }) => {
  const ref = useRef(null);
  const [dsKey, setDsKey] = useState('jugadores');

  const datasets = useMemo(() => {
    const cat = (id) => categorias.find((c) => c.id === Number(id))?.nombre || 'Sin categoría';
    const jug = (id) => {
      const j = jugadores.find((x) => x.id === Number(id));
      return j ? `${j.nombre} ${j.apellido}` : `#${id}`;
    };
    const jugObj = (id) => jugadores.find((x) => x.id === Number(id));
    const tor = (id) => torneos.find((t) => t.id === Number(id));
    const hoy = hoyLocal();
    const esVencida = (p) => p.estado === 'pendiente' && p.vencimiento && p.vencimiento.slice(0, 10) < hoy;

    return {
      jugadores: {
        nombre: 'Jugadores',
        datos: jugadores.map((j) => ({
          'Jugador': `${j.nombre} ${j.apellido}`,
          'Categoría': cat(j.categoriaId),
          'Edad': edadDe(j.fechaNacimiento),
          'Estado': j.activo ? 'Activo' : 'Inactivo',
          'Tutor': j.tutor || '-',
          'Acceso padre': j.accesoPadre ? 'Con acceso' : 'Sin acceso',
        })),
        pivot: { rows: ['Categoría'], cols: ['Estado'], aggregatorName: 'Cantidad' },
      },
      asistencias: {
        nombre: 'Asistencias',
        datos: asistencias.flatMap((a) => {
          const fecha = a.fecha?.slice(0, 10) || '-';
          const d = new Date(`${fecha}T12:00:00`);
          const evento = a.torneoId ? tor(a.torneoId) : null;
          return (a.registros || []).map((r) => ({
            'Fecha': fecha,
            'Año': anioDe(fecha),
            'Mes': mesDe(fecha),
            'Día': Number(fecha.slice(8, 10)) || '-',
            'Día semana': DIAS[d.getDay()] || '-',
            'Tipo': TIPO_LABEL[a.tipo] || a.tipo,
            'Categoría': a.categoriaId ? cat(a.categoriaId) : (evento ? `Evento: ${evento.nombre}` : '—'),
            'Jugador': jug(r.jugadorId),
            'Resultado': r.presente ? 'Presente' : 'Ausente',
            'Origen': r.origen === 'padre' ? 'Padre' : 'Staff',
            'Estado': r.estado === 'pendiente' ? 'Pendiente' : 'Confirmado',
          }));
        }),
        pivot: { rows: ['Categoría'], cols: ['Resultado'], aggregatorName: 'Cantidad' },
      },
      pagos: {
        nombre: 'Pagos',
        datos: pagos.map((p) => ({
          'Jugador': jug(p.jugadorId),
          'Categoría': cat(jugObj(p.jugadorId)?.categoriaId),
          'Mes': MESES[p.mes - 1] || p.mes,
          'Año': p.anio,
          'Monto': Number(p.monto) || 0,
          'Pagado': Number(p.montoPagado) || 0,
          'Saldo': Math.max(0, (Number(p.monto) || 0) - (Number(p.montoPagado) || 0)),
          'Estado': esVencida(p) ? 'Vencida' : (ESTADO_PAGO[p.estado] || p.estado),
          'Método': p.metodo || '—',
          'Registrado por': p.registradoPor === 'padre' ? 'Padre' : p.registradoPor === 'sistema' ? 'Sistema (cuota)' : 'Staff',
          'Detalle': p.detalle || '—',
        })),
        pivot: { rows: ['Año', 'Mes'], cols: ['Estado'], vals: ['Monto'], aggregatorName: 'Suma (Gs.)' },
      },
      eventos: {
        nombre: 'Eventos',
        datos: torneos.map((t) => ({
          'Evento': t.nombre,
          'Tipo': TIPO_LABEL[t.tipo] || 'Evento',
          'Fecha': t.fecha?.slice(0, 10) || '-',
          'Año': t.fecha ? anioDe(t.fecha) : '-',
          'Mes': t.fecha ? mesDe(t.fecha) : '-',
          'Categoría': cat(t.categoriaId),
          'Lugar': t.lugar || '-',
          'Convocados': convocatorias.filter((c) => c.torneoId === t.id).length,
        })),
        pivot: { rows: ['Mes'], cols: ['Tipo'], aggregatorName: 'Cantidad' },
      },
      convocatorias: {
        nombre: 'Convocatorias',
        datos: convocatorias.map((c) => {
          const t = tor(c.torneoId);
          return {
            'Evento': t?.nombre || `#${c.torneoId}`,
            'Tipo': TIPO_LABEL[t?.tipo] || 'Evento',
            'Fecha': t?.fecha?.slice(0, 10) || '-',
            'Categoría': cat(t?.categoriaId),
            'Jugador': jug(c.jugadorId),
          };
        }),
        pivot: { rows: ['Evento'], cols: ['Categoría'], aggregatorName: 'Cantidad' },
      },
    };
  }, [jugadores, categorias, torneos, convocatorias, asistencias, pagos]);

  // Montar (o reconstruir) el pivotUI al cambiar de dataset o de datos
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const ds = datasets[dsKey];
    $(el).pivotUI(ds.datos, {
      localeStrings: LOC.localeStrings,
      renderers: RENDERERS,
      aggregators: AGGREGATORS,
      rendererName: 'Tabla',
      menuLimit: 500,
      ...ds.pivot,
    });
    return () => { el.innerHTML = ''; };
  }, [dsKey, datasets]);

  return (
    <>
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2 d-flex gap-1 align-items-center flex-wrap">
          <span className="small text-muted fw-semibold me-1">Datos:</span>
          {Object.entries(datasets).map(([key, ds]) => (
            <button
              key={key}
              className={`btn btn-sm ${dsKey === key ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setDsKey(key)}
            >
              {ds.nombre} <span className="badge bg-white bg-opacity-25 ms-1">{ds.datos.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="alert alert-info py-2 small mb-3">
        <i className="bi bi-info-circle me-1"></i>
        Arrastrá los campos entre filas y columnas para armar el reporte. Podés cambiar el agregador
        (Cantidad, Suma en Gs., Jugadores únicos) y el tipo de tabla en los desplegables.
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body overflow-auto">
          <div ref={ref}></div>
        </div>
      </div>
    </>
  );
};
