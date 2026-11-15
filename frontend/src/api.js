// Cliente HTTP hacia el backend. El token JWT se guarda en localStorage.
// VITE_API_URL solo hace falta en desarrollo (ej: http://localhost:3800);
// en producción el backend sirve el frontend en el mismo origen y queda vacío.

const API_URL = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = res.status !== 204 ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(data?.error || `Error ${res.status}`, res.status);
  return data;
};

// Sube la foto (dataURL) de un jugador a Supabase Storage vía el backend
export const subirFotoJugador = async (id, dataUrl) => {
  const blob = await (await fetch(dataUrl)).blob();
  const fd = new FormData();
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  fd.append('foto', blob, `foto.${ext}`);
  return apiFetch(`/api/jugadores/${id}/foto`, { method: 'POST', body: fd });
};
