import { useSyncExternalStore } from 'react';
import {
  categoriasMock,
  entrenadoresMock,
  jugadoresMock,
  torneosMock,
  convocatoriasMock,
  asistenciasMock,
  pagosMock,
} from './mockData';

// Store global simple para el mockup: el panel (Dashboard) y la pantalla pública
// de asistencia comparten los mismos datos sin backend.
// Cuando conectemos la API/Supabase, esto se reemplaza por llamadas fetch.

let state = {
  jugadores: jugadoresMock,
  entrenadores: entrenadoresMock,
  categorias: categoriasMock,
  torneos: torneosMock,
  convocatorias: convocatoriasMock,
  asistencias: asistenciasMock,
  pagos: pagosMock,
};

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Leer una colección: useStore((s) => s.jugadores)
export const useStore = (selector) =>
  useSyncExternalStore(subscribe, () => selector(state));

// Escribir una colección con la misma forma que setState funcional:
// setJugadores((prev) => [...prev, nuevo])
export const update = (key, updater) => {
  state = { ...state, [key]: updater(state[key]) };
  emit();
};

export const setterFor = (key) => (updater) => update(key, updater);

const nextId = (lista) => (lista.length ? Math.max(...lista.map((i) => i.id)) + 1 : 1);

const hoy = () => new Date().toISOString().slice(0, 10);

// Marca presente a un jugador en la planilla de entrenamiento de HOY
// de su categoría (la crea si no existe). Devuelve 'nuevo' | 'actualizado' | 'ya_marcado'.
export const marcarAsistenciaJugador = (jugador) => {
  let resultado = 'nuevo';
  const fechaHoy = hoy();

  update('asistencias', (prev) => {
    const idx = prev.findIndex(
      (a) => a.tipo === 'entrenamiento' && a.categoriaId === jugador.categoriaId && a.fecha === fechaHoy
    );

    if (idx === -1) {
      return [
        ...prev,
        {
          id: nextId(prev),
          tipo: 'entrenamiento',
          fecha: fechaHoy,
          categoriaId: jugador.categoriaId,
          torneoId: null,
          registros: [{ jugadorId: jugador.id, presente: true }],
        },
      ];
    }

    const planilla = prev[idx];
    const yaMarcado = planilla.registros.some((r) => r.jugadorId === jugador.id && r.presente);
    if (yaMarcado) {
      resultado = 'ya_marcado';
      return prev;
    }

    resultado = 'actualizado';
    const registros = planilla.registros.map((r) =>
      r.jugadorId === jugador.id ? { ...r, presente: true } : r
    );
    if (!registros.some((r) => r.jugadorId === jugador.id)) {
      registros.push({ jugadorId: jugador.id, presente: true });
    }
    const copia = [...prev];
    copia[idx] = { ...planilla, registros };
    return copia;
  });

  return resultado;
};
