import React, { useState } from 'react';
import { apiFetch, setToken } from '../api';

export default function Login({ onLogin }) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const data = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ usuario: usuario.trim(), password }),
            });
            setToken(data.token);
            onLogin(data.usuario);
        } catch (err) {
            setError(err.message || 'No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-page bg-light-subtle d-flex align-items-center justify-content-center min-vh-screen">
            <div className="login-box" style={{ width: '360px' }}>

                <div className="login-logo text-center mb-3">
                    <a href="#" className="text-decoration-none text-dark fs-2">
                        <i className="bi bi-trophy-fill text-success me-2"></i>
                        Escuela de Fútbol
                    </a>
                </div>

                <div className="card shadow-sm border border-light-subtle rounded">
                    <div className="card-body login-card-body p-4">
                        <p className="login-box-msg text-center text-secondary small mb-4">
                            <b>INICIAR SESIÓN</b>
                        </p>

                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                <i className="bi bi-exclamation-triangle me-1"></i> {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>

                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Usuario"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    required
                                />
                                <span className="input-group-text bg-white text-secondary border-start-0">
                                    <i className="bi bi-person-fill"></i>
                                </span>
                            </div>

                            <div className="input-group mb-4">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span className="input-group-text bg-white text-secondary border-start-0">
                                    <i className="bi bi-lock-fill"></i>
                                </span>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 fw-semibold shadow-sm py-2"
                                        disabled={cargando}
                                    >
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
                                    </button>
                                </div>
                            </div>

                        </form>

                        <div className="mt-4 text-center">
                            <p className="mb-0 small text-muted">
                                <i className="bi bi-person-hearts me-1"></i>
                                Padres: ingresen con el usuario que les dio la escuela
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
