import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Lógica de autenticación
        navigate('/dashboard'); 
    };

    return (
        /* CLASE OFICIAL: login-page centra la tarjeta y le da el fondo gris clásico de AdminLTE */
        <div className="login-page bg-light-subtle d-flex align-items-center justify-content-center min-vh-screen">
            <div className="login-box" style={{ width: '360px' }}>
                
                {/* Logo / Encabezado de la Tarjeta */}
                <div className="login-logo text-center mb-3">
                    <a href="#" className="text-decoration-none text-dark fs-2">
                        Lector de Facturas
                    </a>
                </div>

                {/* Cuerpo de la tarjeta de Login */}
                <div className="card shadow-sm border border-light-subtle rounded">
                    <div className="card-body login-card-body p-4">
                        <p className="login-box-msg text-center text-secondary small mb-4">
                            <b>LOGIN</b>
                        </p>

                        <form onSubmit={handleLogin}>
                            
                            {/* Campo de Correo Electrónico con Icono integrado */}
                            <div className="input-group mb-3">
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                                <span className="input-group-text bg-white text-secondary border-start-0">
                                    <i className="bi bi-envelope-fill"></i>
                                </span>
                            </div>

                            {/* Campo de Contraseña con Icono integrado */}
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

                            {/* Fila inferior: Botón de Envío */}
                            <div className="row">
                                <div className="col-12">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-100 fw-semibold shadow-sm py-2"
                                    >
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        Iniciar Sesión
                                    </button>
                                </div>
                            </div>

                        </form>

                        {/* Enlaces opcionales inferiores al estilo AdminLTE */}
                        <div className="mt-4 text-center">
                            <p className="mb-1 small">
                                <a href="#" className="text-decoration-none text-primary">Olvidé mi contraseña</a>
                            </p>
                            <p className="mb-0 small">
                                <a href="#" className="text-decoration-none text-secondary">Registrar una nueva cuenta</a>
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
