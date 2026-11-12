import React from 'react';

const iniciales = (j) => `${(j.nombre || '?')[0]}${(j.apellido || '')[0] || ''}`.toUpperCase();

export const Avatar = ({ jugador, size = 36 }) =>
  jugador.foto ? (
    <img
      src={jugador.foto}
      alt={`${jugador.nombre} ${jugador.apellido}`}
      className="rounded-circle border"
      style={{ width: size, height: size, objectFit: 'cover' }}
    />
  ) : (
    <div
      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {iniciales(jugador)}
    </div>
  );
