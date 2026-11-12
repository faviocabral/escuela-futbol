// Datos mock para desarrollar el flujo de pantallas.
// Cuando conectemos el backend/Supabase, este archivo se reemplaza por llamadas a la API.

export const usuariosMock = [
  { id: 1, usuario: 'admin', password: 'admin123', nombre: 'Administrador' },
  { id: 2, usuario: 'entrenador', password: 'futbol123', nombre: 'Prof. Carlos Méndez' },
];

export const categoriasMock = [
  { id: 1, nombre: 'Sub-7', edadMin: 5, edadMax: 7, entrenadorId: 1 },
  { id: 2, nombre: 'Sub-9', edadMin: 8, edadMax: 9, entrenadorId: 1 },
  { id: 3, nombre: 'Sub-11', edadMin: 10, edadMax: 11, entrenadorId: 2 },
  { id: 4, nombre: 'Sub-13', edadMin: 12, edadMax: 13, entrenadorId: 2 },
];

export const entrenadoresMock = [
  { id: 1, nombre: 'Carlos', apellido: 'Méndez', telefono: '0981-123456', email: 'cmendez@escuela.com' },
  { id: 2, nombre: 'Laura', apellido: 'Giménez', telefono: '0982-654321', email: 'lgimenez@escuela.com' },
];

export const jugadoresMock = [
  { id: 1, nombre: 'Thiago', apellido: 'Vera', documento: '5123456', fechaNacimiento: '2018-03-12', categoriaId: 1, tutor: 'María Vera', telefonoTutor: '0981-111222', activo: true },
  { id: 2, nombre: 'Mateo', apellido: 'Rojas', documento: '5234567', fechaNacimiento: '2018-07-25', categoriaId: 1, tutor: 'Juan Rojas', telefonoTutor: '0983-333444', activo: true },
  { id: 3, nombre: 'Santiago', apellido: 'Benítez', documento: '5345678', fechaNacimiento: '2016-01-30', categoriaId: 2, tutor: 'Ana Benítez', telefonoTutor: '0985-555666', activo: true },
  { id: 4, nombre: 'Lorenzo', apellido: 'Acosta', documento: '5456789', fechaNacimiento: '2015-11-05', categoriaId: 3, tutor: 'Pedro Acosta', telefonoTutor: '0971-777888', activo: true },
  { id: 5, nombre: 'Benjamín', apellido: 'Duarte', documento: '5567890', fechaNacimiento: '2014-05-18', categoriaId: 3, tutor: 'Luisa Duarte', telefonoTutor: '0981-999000', activo: true },
  { id: 6, nombre: 'Joaquín', apellido: 'Ojeda', documento: '5678901', fechaNacimiento: '2013-09-22', categoriaId: 4, tutor: 'Rosa Ojeda', telefonoTutor: '0984-112233', activo: false },
];

export const torneosMock = [
  { id: 1, nombre: 'Copa Primavera', fecha: '2026-11-21', lugar: 'Complejo Deportivo Municipal', categoriaId: 1 },
  { id: 2, nombre: 'Torneo Apertura - Fecha 5', fecha: '2026-11-28', lugar: 'Club Nacional', categoriaId: 3 },
  { id: 3, nombre: 'Copa Verano Infantil', fecha: '2026-12-12', lugar: 'Polideportivo Central', categoriaId: 2 },
];

// Convocatorias: qué jugadores fueron convocados a cada torneo
export const convocatoriasMock = [
  { id: 1, torneoId: 1, jugadorId: 1 },
  { id: 2, torneoId: 1, jugadorId: 2 },
];

// Planillas de asistencia (torneo o entrenamiento)
export const asistenciasMock = [
  {
    id: 1,
    tipo: 'entrenamiento',
    fecha: '2026-11-10',
    categoriaId: 1,
    torneoId: null,
    registros: [
      { jugadorId: 1, presente: true },
      { jugadorId: 2, presente: false },
    ],
  },
];

export const pagosMock = [
  { id: 1, jugadorId: 1, mes: 11, anio: 2026, monto: 150000, metodo: 'Efectivo', fechaPago: '2026-11-05' },
  { id: 2, jugadorId: 3, mes: 11, anio: 2026, monto: 150000, metodo: 'Transferencia', fechaPago: '2026-11-08' },
  { id: 3, jugadorId: 1, mes: 10, anio: 2026, monto: 150000, metodo: 'Efectivo', fechaPago: '2026-10-03' },
];
