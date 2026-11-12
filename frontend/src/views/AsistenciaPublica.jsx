import React, { useState } from 'react';
import { useStore, marcarAsistenciaJugador } from '../store';
import { Avatar } from '../components/Avatar';

// Pantalla pública para padres: marcar asistencia con la cédula del jugador.
// No requiere login ni da acceso al panel de administración.
export default function AsistenciaPublica() {
  const jugadores = useStore((s) => s.jugadores);
  const categorias = useStore((s) => s.categorias);

  const [cedula, setCedula] = useState('');
  const [jugador, setJugador] = useState(null);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null); // 'ok' | 'ya_marcado'

  const categoriaNombre = (id) =>
    categorias.find((c) => c.id === id)?.nombre || 'Sin categoría';

  const buscar = (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    const encontrado = jugadores.find((j) => j.documento === cedula.trim());
    if (!encontrado) {
      setJugador(null);
      setError('No encontramos un jugador con esa cédula. Verificá el número.');
      return;
    }
    setJugador(encontrado);
  };

  const confirmar = () => {
    const res = marcarAsistenciaJugador(jugador);
    setResultado(res === 'ya_marcado' ? 'ya_marcado' : 'ok');
  };

  const reiniciar = () => {
    setCedula('');
    setJugador(null);
    setError('');
    setResultado(null);
  };

  const horaActual = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3"
      style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4">

          <div className="text-center mb-4">
            <i className="bi bi-trophy-fill text-success fs-1"></i>
            <h1 className="h4 fw-bold mt-2 mb-1">Escuela de Fútbol</h1>
            <p className="text-muted small mb-0">Registro de asistencia</p>
          </div>

          {/* Paso 1: buscar por cédula */}
          {!jugador && (
            <form onSubmit={buscar}>
              <label className="form-label small fw-semibold text-secondary">
                Cédula del jugador
              </label>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Ej: 5123456"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  inputMode="numeric"
                  autoFocus
                />
                <button type="submit" className="btn btn-success px-4">
                  <i className="bi bi-search"></i>
                </button>
              </div>
              {error && (
                <div className="alert alert-danger py-2 small mb-0" role="alert">
                  <i className="bi bi-exclamation-triangle me-1"></i> {error}
                </div>
              )}
            </form>
          )}

          {/* Paso 2: confirmar jugador */}
          {jugador && !resultado && (
            <div className="text-center">
              <div className="d-flex justify-content-center mb-3">
                <Avatar jugador={jugador} size={80} />
              </div>
              <h2 className="h5 fw-bold mb-1">{jugador.nombre} {jugador.apellido}</h2>
              <p className="text-muted small mb-1">
                {categoriaNombre(jugador.categoriaId)} · CI {jugador.documento}
              </p>
              {!jugador.activo && (
                <div className="alert alert-warning py-2 small">
                  Este jugador figura como inactivo. Consultá con la administración.
                </div>
              )}
              <div className="d-grid gap-2 mt-3">
                <button
                  className="btn btn-success btn-lg fw-semibold"
                  onClick={confirmar}
                  disabled={!jugador.activo}
                >
                  <i className="bi bi-check2-circle me-2"></i>
                  Marcar presente — {new Date().toLocaleDateString('es-PY')}
                </button>
                <button className="btn btn-outline-secondary" onClick={reiniciar}>
                  No es mi hijo/a
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: resultado */}
          {resultado && jugador && (
            <div className="text-center">
              {resultado === 'ok' ? (
                <>
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '64px' }}></i>
                  <h2 className="h5 fw-bold mt-3 mb-1">¡Asistencia registrada!</h2>
                  <p className="text-muted small mb-0">
                    {jugador.nombre} {jugador.apellido} — hoy a las {horaActual}
                  </p>
                </>
              ) : (
                <>
                  <i className="bi bi-info-circle-fill text-warning" style={{ fontSize: '64px' }}></i>
                  <h2 className="h5 fw-bold mt-3 mb-1">Ya estaba marcado</h2>
                  <p className="text-muted small mb-0">
                    La asistencia de {jugador.nombre} {jugador.apellido} ya fue registrada hoy.
                  </p>
                </>
              )}
              <button className="btn btn-outline-success mt-4" onClick={reiniciar}>
                <i className="bi bi-arrow-left me-1"></i> Registrar otro jugador
              </button>
            </div>
          )}

        </div>
        <div className="card-footer bg-white text-center border-top py-2">
          <span className="text-muted" style={{ fontSize: '12px' }}>
            Acceso solo para registro de asistencia
          </span>
        </div>
      </div>
    </div>
  );
}
