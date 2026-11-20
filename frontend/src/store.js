import { useSyncExternalStore } from 'react';
import { apiFetch } from './api';
import { aviso } from './utils/notify';

// Store global del panel: cache en memoria de las colecciones traídas de la API.
// Las vistas leen con useStore(...) y las acciones actualizan el cache + la DB.

let state = {
  jugadores: [],
  entrenadores: [],
  categorias: [],
  torneos: [],
  convocatorias: [],
  asistencias: [],
  pagos: [],
};

let cargando = false;

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Leer una colección: useStore((s) => s.jugadores)
export const useStore = (selector) =>
  useSyncExternalStore(subscribe, () => selector(state));

export const useCargando = () => useSyncExternalStore(subscribe, () => cargando);

// Carga inicial de todas las colecciones (se llama al entrar al Dashboard)
export const cargarDatos = async () => {
  cargando = true;
  emit();
  try {
    const [jugadores, entrenadores, categorias, torneos, convocatorias, asistencias, pagos] =
      await Promise.all([
        apiFetch('/api/jugadores'),
        apiFetch('/api/entrenadores'),
        apiFetch('/api/categorias'),
        apiFetch('/api/torneos'),
        apiFetch('/api/convocatorias'),
        apiFetch('/api/asistencias'),
        apiFetch('/api/pagos'),
      ]);
    state = { jugadores, entrenadores, categorias, torneos, convocatorias, asistencias, pagos };
  } finally {
    cargando = false;
    emit();
  }
};

// ── Acciones CRUD ─────────────────────────────────────────────
// Devuelven el registro guardado, o undefined si la API falló (ya muestra el aviso).

const ejec = (fn) => fn().catch((e) => {
  aviso(e.message || 'Error de conexión con el servidor.', 'error');
  return undefined;
});

export const crearEn = (key, ruta) => (registro) =>
  ejec(async () => {
    const creado = await apiFetch(ruta, { method: 'POST', body: JSON.stringify(registro) });
    state = { ...state, [key]: [...state[key], creado] };
    emit();
    return creado;
  });

export const actualizarEn = (key, ruta) => (registro) =>
  ejec(async () => {
    const actualizado = await apiFetch(`${ruta}/${registro.id}`, { method: 'PUT', body: JSON.stringify(registro) });
    state = { ...state, [key]: state[key].map((i) => (i.id === actualizado.id ? actualizado : i)) };
    emit();
    return actualizado;
  });

export const eliminarEn = (key, ruta) => (id) =>
  ejec(async () => {
    await apiFetch(`${ruta}/${id}`, { method: 'DELETE' });
    state = { ...state, [key]: state[key].filter((i) => i.id !== id) };
    emit();
    return true;
  });

// Reemplaza la lista de convocados de un torneo y refresca el cache
export const guardarConvocatoria = (torneoId, jugadorIds) =>
  ejec(async () => {
    await apiFetch(`/api/torneos/${torneoId}/convocatoria`, {
      method: 'PUT',
      body: JSON.stringify({ jugadorIds }),
    });
    const convocatorias = await apiFetch('/api/convocatorias');
    state = { ...state, convocatorias };
    emit();
    return true;
  });

// Guarda una planilla de asistencia y refresca el cache
export const guardarAsistencia = (planilla) =>
  ejec(async () => {
    await apiFetch('/api/asistencias', { method: 'POST', body: JSON.stringify(planilla) });
    const asistencias = await apiFetch('/api/asistencias');
    state = { ...state, asistencias };
    emit();
    return true;
  });

// Confirma las marcas pendientes de una planilla (cargadas por padres)
export const confirmarAsistencia = (planillaId) =>
  ejec(async () => {
    await apiFetch(`/api/asistencias/${planillaId}/confirmar`, { method: 'PUT', body: JSON.stringify({}) });
    const asistencias = await apiFetch('/api/asistencias');
    state = { ...state, asistencias };
    emit();
    return true;
  });

// Registra un cobro (total o parcial) sobre una cuota pendiente
export const pagarCuota = (id, datos) =>
  ejec(async () => {
    const actualizado = await apiFetch(`/api/pagos/${id}/pagar`, { method: 'PUT', body: JSON.stringify(datos) });
    state = { ...state, pagos: state.pagos.map((p) => (p.id === id ? actualizado : p)) };
    emit();
    return actualizado;
  });

// Confirma o rechaza un pago pendiente (el padre subió el comprobante)
export const cambiarEstadoPago = (id, accion) =>
  ejec(async () => {
    const actualizado = await apiFetch(`/api/pagos/${id}/${accion}`, { method: 'PUT', body: JSON.stringify({}) });
    state = { ...state, pagos: state.pagos.map((p) => (p.id === id ? actualizado : p)) };
    emit();
    return actualizado;
  });

// Actualiza en el cache la foto recién subida de un jugador
export const actualizarFotoJugador = (jugadorId, fotoUrl) => {
  state = {
    ...state,
    jugadores: state.jugadores.map((j) => (j.id === jugadorId ? { ...j, foto: fotoUrl } : j)),
  };
  emit();
};
