# Escuela de Fútbol

Sistema de gestión para una escuela de fútbol: fichas de jugadores, entrenadores, categorías (Sub-7, Sub-9…), calendario de torneos, convocatorias, control de asistencia y pagos de mensualidad.

## Estructura

- `frontend/` — Panel web en React + Vite (AdminLTE 4 / Bootstrap 5, responsive). **Actualmente funciona como mockup**: los datos viven en `src/mockData.js` para validar el flujo de pantallas.
- `backend/` — API en Node.js + Express (pendiente de reescritura para el dominio de fútbol).

## Módulos (frontend)

| Módulo | Qué hace |
|---|---|
| Jugadores | ABM de ficha de jugador, filtro por nombre/categoría/estado |
| Entrenadores | ABM de entrenadores, muestra categorías a cargo |
| Categorías | ABM de categorías por edad con entrenador asignado |
| Torneos | Calendario + convocatoria (checklist de jugadores por categoría) |
| Asistencia | Planilla por entrenamiento (categoría+fecha) o por torneo (convocados) |
| Pagos | Mensualidad por jugador, alerta de pendientes, historial filtrado |

## Acceso (mock)

`admin / admin123`

## Ejecutar en desarrollo

```bash
cd frontend
npm install
npm run dev
```

## Próximos pasos (conexión real)

1. Reescribir `backend/index.js` con endpoints REST para jugadores, entrenadores, categorías, torneos, convocatorias, asistencias, pagos y login de usuarios.
2. Base de datos en **Supabase** (Postgres gratuito).
3. Deploy del frontend + backend en **Render** (el backend servirá el build del frontend).

## Notas

- Las variables de entorno nunca se commitean: `.env` está en `.gitignore`; usar `backend/.env.example` como guía.
