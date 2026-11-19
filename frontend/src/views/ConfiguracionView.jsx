import React, { useEffect, useState } from 'react';
import { aviso, toast } from '../utils/notify';
import { apiFetch } from '../api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Configuración del sistema: parámetros de las cuotas anuales + generador.
export const ConfiguracionView = ({ jugadores, categorias, onRecargar }) => {
  const hoy = new Date();
  const [cfg, setCfg] = useState(null);
  const [guardandoCfg, setGuardandoCfg] = useState(false);
  const [genAnio, setGenAnio] = useState(hoy.getFullYear());
  const [genAlcance, setGenAlcance] = useState('todos');
  const [genCatId, setGenCatId] = useState('');
  const [genJugId, setGenJugId] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    apiFetch('/api/config').then(setCfg).catch(() => {});
  }, []);

  const guardarConfig = async () => {
    setGuardandoCfg(true);
    try {
      const c = await apiFetch('/api/config', {
        method: 'PUT',
        body: JSON.stringify({
          cuota_monto: cfg.cuota_monto,
          cuota_mes_inicio: cfg.cuota_mes_inicio,
          cuota_mes_fin: cfg.cuota_mes_fin,
          cuota_dia_vencimiento: cfg.cuota_dia_vencimiento,
        }),
      });
      setCfg(c);
      toast('Configuración guardada');
    } catch (e) {
      aviso(e.message, 'error');
    } finally {
      setGuardandoCfg(false);
    }
  };

  const generarCuotas = async () => {
    if (genAlcance === 'categoria' && !genCatId) return aviso('Elegí la categoría.');
    if (genAlcance === 'jugador' && !genJugId) return aviso('Elegí el jugador.');
    setGenerando(true);
    try {
      const r = await apiFetch('/api/cuotas/generar', {
        method: 'POST',
        body: JSON.stringify({
          anio: Number(genAnio), alcance: genAlcance,
          categoriaId: genCatId ? Number(genCatId) : undefined,
          jugadorId: genJugId ? Number(genJugId) : undefined,
        }),
      });
      toast(`${r.generadas} cuota(s) generada(s)${r.saltadas ? ` — ${r.saltadas} ya existían` : ''}`);
      onRecargar?.();
    } catch (e) {
      aviso(e.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 fw-bold border-bottom">
            <i className="bi bi-cash-stack text-primary me-2"></i> Cuotas del año
          </div>
          <div className="card-body">
            {!cfg ? (
              <div className="text-muted small">Cargando configuración…</div>
            ) : (
              <>
                <div className="row g-2 align-items-end border-bottom pb-3 mb-3">
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Monto cuota (Gs.)</label>
                    <input type="number" className="form-control form-control-sm" value={cfg.cuota_monto}
                      onChange={(e) => setCfg({ ...cfg, cuota_monto: e.target.value })} min="0" step="1000" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Desde</label>
                    <select className="form-select form-select-sm" value={cfg.cuota_mes_inicio}
                      onChange={(e) => setCfg({ ...cfg, cuota_mes_inicio: e.target.value })}>
                      {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Hasta</label>
                    <select className="form-select form-select-sm" value={cfg.cuota_mes_fin}
                      onChange={(e) => setCfg({ ...cfg, cuota_mes_fin: e.target.value })}>
                      {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Vence el día</label>
                    <input type="number" className="form-control form-control-sm" value={cfg.cuota_dia_vencimiento}
                      onChange={(e) => setCfg({ ...cfg, cuota_dia_vencimiento: e.target.value })} min="1" max="28" />
                  </div>
                  <div className="col-12 col-md-4 text-md-end">
                    <button className="btn btn-sm btn-outline-primary" disabled={guardandoCfg} onClick={guardarConfig}>
                      <i className="bi bi-save me-1"></i>Guardar configuración
                    </button>
                  </div>
                </div>
                <div className="row g-2 align-items-end">
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Año</label>
                    <input type="number" className="form-control form-control-sm" value={genAnio}
                      onChange={(e) => setGenAnio(e.target.value)} min="2020" max="2100" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Generar para</label>
                    <select className="form-select form-select-sm" value={genAlcance} onChange={(e) => setGenAlcance(e.target.value)}>
                      <option value="todos">Todos los jugadores activos</option>
                      <option value="categoria">Una categoría</option>
                      <option value="jugador">Un jugador</option>
                    </select>
                  </div>
                  {genAlcance === 'categoria' && (
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Categoría</label>
                      <select className="form-select form-select-sm" value={genCatId} onChange={(e) => setGenCatId(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  )}
                  {genAlcance === 'jugador' && (
                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Jugador</label>
                      <select className="form-select form-select-sm" value={genJugId} onChange={(e) => setGenJugId(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {jugadores.filter((j) => j.activo).map((j) => (
                          <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-12 col-md-3 text-md-end">
                    <button className="btn btn-sm btn-success" disabled={generando} onClick={generarCuotas}>
                      {generando ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-magic me-1"></i>}
                      Generar cuotas
                    </button>
                  </div>
                </div>
                <div className="form-text small mt-2">
                  Genera cuotas de {MESES[Number(cfg.cuota_mes_inicio) - 1]} a {MESES[Number(cfg.cuota_mes_fin) - 1]} con vencimiento el día {cfg.cuota_dia_vencimiento} de cada mes.
                  Quien se dé de alta a mitad de año arranca desde su mes de alta; las cuotas ya existentes se saltan.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
