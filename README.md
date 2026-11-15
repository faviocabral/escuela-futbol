# Escuela de Fútbol

Sistema de gestión para una escuela de fútbol: fichas de jugadores, entrenadores, categorías (Sub-7, Sub-9…), calendario de torneos con convocatorias, control de asistencia (staff + pantalla pública para padres) y pagos de mensualidad.

## Estructura

- `frontend/` — Panel web en React + Vite (AdminLTE 4 / Bootstrap 5, responsive).
- `backend/` — API en Node.js + Express + Knex + PostgreSQL. Sirve el build del frontend (mismo origen).
- `backend/schema.sql` — schema de la base de datos.
- `backend/seed.js` — crea el usuario `admin` inicial.
- `render.yaml` — blueprint para deploy en Render.

## Módulos

| Módulo | Qué hace |
|---|---|
| Jugadores | ABM de ficha (con foto), filtro por nombre/categoría/estado |
| Entrenadores | ABM, muestra categorías a cargo |
| Categorías | ABM por rango de edad con entrenador asignado |
| Torneos | Calendario + convocatoria (checklist de jugadores) |
| Asistencia | Planilla staff (entrenamiento o torneo) + historial |
| `/asistencia` | Pantalla pública: padres marcan asistencia con la cédula |
| Pagos | Mensualidad por jugador, pendientes del mes, historial |

## Desarrollo local

```bash
# Backend
cd backend
cp .env.example .env   # completar credenciales
npm install
node index.js          # http://localhost:3800

# Frontend (otra terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173 → llama a VITE_API_URL
```

## Deploy en la nube (Supabase + Render)

### 1. Supabase (base de datos + storage)

1. Crear proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → ejecutar `backend/schema.sql`.
3. **Storage** → crear bucket `jugadores-fotos` marcado como **público**.
4. Obtener credenciales:
   - **Settings → API**: `SUPABASE_URL` y `service_role` key.
   - **Connect / Settings → Database**: usar el **pooler** (Session, puerto 6543) — Render no soporta IPv6, la conexión directa no funciona. Host `aws-0-<region>.pooler.supabase.com`, user `postgres.<project-ref>`.

### 2. Render (app)

1. En [render.com](https://render.com) → **New → Blueprint** → conectar el repo. Detecta `render.yaml` solo.
2. Completar las env vars marcadas `sync: false`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. Luego correr el seed para crear el admin:
   - En Render → **Shell** del servicio → `cd backend && npm run seed`
   - O desde local apuntando el `.env` a Supabase y `npm run seed`.
4. La app queda en `https://<servicio>.onrender.com` y la pantalla de padres en `https://<servicio>.onrender.com/asistencia`.

> ⚠️ El plan free de Render duerme el servicio tras ~15 min sin uso; el primer request tras dormir tarda ~50 segundos.

## Seguridad

- `.env` nunca se commitea (está en `.gitignore`); usar los `.env.example` como guía.
- Todos los endpoints privados exigen `Authorization: Bearer <JWT>` (12h).
- Cambiá `admin123` después del primer ingreso en producción.
