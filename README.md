# Escuela Fútbol — Lector de Facturas

Sistema para procesar facturas en imágenes usando IA (Google Gemini), almacenar los datos en PostgreSQL y gestionar clientes desde un panel web.

## Estructura

- `backend/` — API en Node.js + Express. Extrae datos de facturas con Gemini, los guarda en PostgreSQL (Knex) y expone endpoints paginados de facturas y clientes.
- `frontend/` — Panel web en React + Vite (Bootstrap/AdminLTE/PrimeReact).

## Requisitos

- Node.js 20+
- PostgreSQL con las tablas `public.facturas` y `public.clientes`
- Una API key de Google Gemini

## Configuración

1. Copia `backend/.env.example` a `backend/.env` y completa los valores:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Variables requeridas: `GEMINI_API_KEY`, `API_SECRET_TOKEN`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

2. **Nunca commitees `.env`** — ya está en `.gitignore`.

## Ejecutar

### Local

```bash
# Backend (puerto 3800)
cd backend
npm install
node index.js

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

### Docker

```bash
cd backend && docker compose up -d
cd frontend && docker compose up -d
```

## Seguridad

- Todos los endpoints del backend exigen `Authorization: Bearer <API_SECRET_TOKEN>`.
- Los previews de facturas (`backend/public/previews/`) y datos (`datos_excel/`, `uploads/`, `temp/`) están excluidos del control de versiones.
