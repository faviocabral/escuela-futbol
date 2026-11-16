import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import knexConfig from 'knex';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3800;
const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-en-produccion';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// ☁️ Cliente de Supabase Storage (fotos de jugadores)
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// 🗄️ CONEXIÓN A POSTGRESQL VÍA KNEX
const db = knexConfig({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'tu_password',
        database: process.env.DB_NAME || 'escuela_futbol',
        // Supabase exige SSL; en local se omite con DB_SSL=false
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: { min: 2, max: 20 }
});

// Wrapper para capturar errores async y responder 500
const h = (fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (e) { console.error(`❌ ${req.method} ${req.path}:`, e.message); res.status(500).json({ error: 'Error interno del servidor.' }); }
};

// 🔐 Middleware JWT — todos los endpoints privados pasan por acá
function verificarToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso no autorizado. Falta el token.' });
    }
    try {
        req.usuario = jwt.verify(header.split(' ')[1], JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ error: 'Sesión expirada o token inválido.' });
    }
}

// ─────────────────────────────────────────────────────────────
// MAPEADORES snake_case (DB) ↔ camelCase (frontend)
// ─────────────────────────────────────────────────────────────
const jugOut = (j) => ({
    id: j.id, nombre: j.nombre, apellido: j.apellido, documento: j.documento,
    fechaNacimiento: j.fecha_nacimiento, categoriaId: j.categoria_id,
    tutor: j.tutor, telefonoTutor: j.telefono_tutor, activo: j.activo, foto: j.foto_url,
});
const jugIn = (j) => ({
    nombre: j.nombre?.trim(), apellido: j.apellido?.trim(), documento: j.documento || null,
    fecha_nacimiento: j.fechaNacimiento || null, categoria_id: j.categoriaId ?? null,
    tutor: j.tutor || null, telefono_tutor: j.telefonoTutor || null, activo: j.activo ?? true,
});

const entIn = (e) => ({ nombre: e.nombre?.trim(), apellido: e.apellido?.trim(), telefono: e.telefono || null, email: e.email || null });

const catOut = (c) => ({ id: c.id, nombre: c.nombre, edadMin: c.edad_min, edadMax: c.edad_max, entrenadorId: c.entrenador_id });
const catIn = (c) => ({ nombre: c.nombre?.trim(), edad_min: c.edadMin ?? null, edad_max: c.edadMax ?? null, entrenador_id: c.entrenadorId ?? null });

const torOut = (t) => ({ id: t.id, nombre: t.nombre, fecha: t.fecha, lugar: t.lugar, categoriaId: t.categoria_id });
const torIn = (t) => ({ nombre: t.nombre?.trim(), fecha: t.fecha, lugar: t.lugar || null, categoria_id: t.categoriaId ?? null });

const pagoOut = (p) => ({ id: p.id, jugadorId: p.jugador_id, mes: p.mes, anio: p.anio, monto: Number(p.monto), metodo: p.metodo, fechaPago: p.fecha_pago });
const pagoIn = (p) => ({ jugador_id: p.jugadorId, mes: p.mes, anio: p.anio, monto: p.monto, metodo: p.metodo || null, fecha_pago: p.fechaPago || new Date() });

const asisOut = (a, regs = []) => ({
    id: a.id, tipo: a.tipo, fecha: a.fecha, categoriaId: a.categoria_id, torneoId: a.torneo_id,
    registros: regs.filter((r) => r.asistencia_id === a.id).map((r) => ({ jugadorId: r.jugador_id, presente: r.presente })),
});

const convOut = (c) => ({ id: c.id, torneoId: c.torneo_id, jugadorId: c.jugador_id });

// ─────────────────────────────────────────────────────────────
// 🔑 LOGIN
// ─────────────────────────────────────────────────────────────
app.post('/api/login', h(async (req, res) => {
    const { usuario, password } = req.body || {};
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });

    const u = await db('usuarios').where({ usuario: usuario.trim().toLowerCase() }).first();
    if (!u || !(await bcrypt.compare(password, u.password_hash))) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const token = jwt.sign({ id: u.id, usuario: u.usuario, nombre: u.nombre }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, usuario: { id: u.id, usuario: u.usuario, nombre: u.nombre } });
}));

// ─────────────────────────────────────────────────────────────
// 🌐 PÚBLICO — asistencia por cédula (sin login)
// ─────────────────────────────────────────────────────────────
// Busca jugador por cédula incluyendo el nombre de su categoría
const jugadorPorDocumento = (documento) =>
    db('jugadores')
        .leftJoin('categorias', 'jugadores.categoria_id', 'categorias.id')
        .select('jugadores.*', 'categorias.nombre as categoria_nombre')
        .where({ 'jugadores.documento': documento })
        .first();

const jugPublicoOut = (j) => ({ ...jugOut(j), categoriaNombre: j.categoria_nombre || 'Sin categoría' });

app.get('/api/public/jugador/:documento', h(async (req, res) => {
    const j = await jugadorPorDocumento(req.params.documento);
    if (!j) return res.status(404).json({ error: 'No encontramos un jugador con esa cédula.' });
    res.json(jugPublicoOut(j));
}));

app.post('/api/public/asistencia', h(async (req, res) => {
    const { documento } = req.body || {};
    const j = await jugadorPorDocumento(documento);
    if (!j) return res.status(404).json({ error: 'No encontramos un jugador con esa cédula.' });
    if (!j.activo) return res.status(400).json({ error: 'Este jugador figura como inactivo.' });

    const hoy = new Date().toISOString().slice(0, 10);
    let planilla = await db('asistencias')
        .where({ tipo: 'entrenamiento', categoria_id: j.categoria_id, fecha: hoy }).first();
    if (!planilla) {
        [planilla] = await db('asistencias')
            .insert({ tipo: 'entrenamiento', fecha: hoy, categoria_id: j.categoria_id }).returning('*');
    }

    const yaMarcado = await db('asistencia_registros')
        .where({ asistencia_id: planilla.id, jugador_id: j.id, presente: true }).first();
    if (yaMarcado) return res.json({ resultado: 'ya_marcado', jugador: jugPublicoOut(j) });

    await db('asistencia_registros')
        .insert({ asistencia_id: planilla.id, jugador_id: j.id, presente: true })
        .onConflict(['asistencia_id', 'jugador_id']).merge({ presente: true });

    res.json({ resultado: 'ok', jugador: jugPublicoOut(j) });
}));

// ─────────────────────────────────────────────────────────────
// 📦 CRUD GENÉRICO (jugadores, entrenadores, categorías, torneos)
// ─────────────────────────────────────────────────────────────
const crud = (ruta, tabla, salida, entrada, orden = 'id') => {
    app.get(`/api/${ruta}`, verificarToken, h(async (req, res) => {
        res.json(await db(tabla).select('*').orderBy(orden).then((rows) => rows.map(salida)));
    }));
    app.post(`/api/${ruta}`, verificarToken, h(async (req, res) => {
        const [row] = await db(tabla).insert(entrada(req.body)).returning('*');
        res.status(201).json(salida(row));
    }));
    app.put(`/api/${ruta}/:id`, verificarToken, h(async (req, res) => {
        const [row] = await db(tabla).where({ id: req.params.id }).update(entrada(req.body)).returning('*');
        if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
        res.json(salida(row));
    }));
    app.delete(`/api/${ruta}/:id`, verificarToken, h(async (req, res) => {
        await db(tabla).where({ id: req.params.id }).del();
        res.json({ ok: true });
    }));
};

crud('jugadores', 'jugadores', jugOut, jugIn, ['apellido', 'nombre']);
crud('entrenadores', 'entrenadores', (e) => e, entIn);
crud('categorias', 'categorias', catOut, catIn, 'edad_min');
crud('torneos', 'torneos', torOut, torIn, 'fecha');

// 📸 Subir foto del jugador a Supabase Storage (bucket público 'jugadores-fotos')
app.post('/api/jugadores/:id/foto', verificarToken, upload.single('foto'), h(async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase Storage no configurado.' });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo de foto.' });

    const ext = (req.file.mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const nombre = `jugador_${req.params.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
        .from('jugadores-fotos')
        .upload(nombre, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (error) return res.status(500).json({ error: `Error al subir foto: ${error.message}` });

    const { data } = supabase.storage.from('jugadores-fotos').getPublicUrl(nombre);
    await db('jugadores').where({ id: req.params.id }).update({ foto_url: data.publicUrl });
    res.json({ foto: data.publicUrl });
}));

// ─────────────────────────────────────────────────────────────
// 📋 CONVOCATORIAS
// ─────────────────────────────────────────────────────────────
app.get('/api/convocatorias', verificarToken, h(async (req, res) => {
    res.json(await db('convocatorias').select('*').then((rows) => rows.map(convOut)));
}));

// Reemplaza la lista de convocados de un torneo
app.put('/api/torneos/:id/convocatoria', verificarToken, h(async (req, res) => {
    const jugadorIds = req.body.jugadorIds || [];
    await db.transaction(async (trx) => {
        await trx('convocatorias').where({ torneo_id: req.params.id }).del();
        if (jugadorIds.length) {
            await trx('convocatorias').insert(jugadorIds.map((jid) => ({ torneo_id: req.params.id, jugador_id: jid })));
        }
    });
    res.json({ ok: true });
}));

// ─────────────────────────────────────────────────────────────
// ✅ ASISTENCIAS (planillas con registros)
// ─────────────────────────────────────────────────────────────
app.get('/api/asistencias', verificarToken, h(async (req, res) => {
    const planillas = await db('asistencias').select('*').orderBy('fecha', 'desc');
    const registros = planillas.length
        ? await db('asistencia_registros').whereIn('asistencia_id', planillas.map((p) => p.id))
        : [];
    res.json(planillas.map((p) => asisOut(p, registros)));
}));

// Guarda (o reemplaza) una planilla: { tipo, fecha, categoriaId, torneoId, registros:[{jugadorId,presente}] }
app.post('/api/asistencias', verificarToken, h(async (req, res) => {
    const { tipo, fecha, categoriaId, torneoId, registros = [] } = req.body || {};
    if (!tipo || !fecha) return res.status(400).json({ error: 'Tipo y fecha son obligatorios.' });

    const planilla = await db.transaction(async (trx) => {
        // Reutiliza la planilla existente si ya hay una para ese torneo o categoría+fecha
        const existente = await trx('asistencias')
            .where(tipo === 'torneo' ? { torneo_id: torneoId } : { tipo, categoria_id: categoriaId, fecha })
            .first();

        let cab;
        if (existente) {
            cab = existente;
            await trx('asistencia_registros').where({ asistencia_id: cab.id }).del();
        } else {
            [cab] = await trx('asistencias')
                .insert({ tipo, fecha, categoria_id: categoriaId ?? null, torneo_id: torneoId ?? null })
                .returning('*');
        }
        if (registros.length) {
            await trx('asistencia_registros').insert(
                registros.map((r) => ({ asistencia_id: cab.id, jugador_id: r.jugadorId, presente: !!r.presente }))
            );
        }
        return cab;
    });

    res.status(201).json(asisOut(planilla, registros.map((r) => ({ asistencia_id: planilla.id, jugador_id: r.jugadorId, presente: !!r.presente }))));
}));

// ─────────────────────────────────────────────────────────────
// 💰 PAGOS
// ─────────────────────────────────────────────────────────────
app.get('/api/pagos', verificarToken, h(async (req, res) => {
    res.json(await db('pagos').select('*').orderBy('fecha_pago', 'desc').then((rows) => rows.map(pagoOut)));
}));

app.post('/api/pagos', verificarToken, h(async (req, res) => {
    try {
        const [row] = await db('pagos').insert(pagoIn(req.body)).returning('*');
        res.status(201).json(pagoOut(row));
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un pago para ese jugador en ese período.' });
        throw e;
    }
}));

app.delete('/api/pagos/:id', verificarToken, h(async (req, res) => {
    await db('pagos').where({ id: req.params.id }).del();
    res.json({ ok: true });
}));

// 🖥️ SERVIR EL FRONTEND (build de Vite) — mismo origen, sin CORS en producción
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/(api|previews)\/).*/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.warn('⚠️ No se encontró frontend/dist. Ejecuta "npm run build" en frontend/ para servir el panel web.');
}

// Auto-seed: si no hay usuarios, crea el admin inicial (el plan free de Render no tiene Shell)
async function asegurarAdmin() {
    try {
        const existe = await db('usuarios').first();
        if (existe) return;
        await db('usuarios').insert({
            usuario: 'admin',
            password_hash: await bcrypt.hash('admin123', 10),
            nombre: 'Administrador',
        });
        console.log('✅ Usuario inicial creado: admin / admin123 (cambiar después del primer ingreso)');
    } catch (err) {
        console.error('⚠️ No se pudo verificar/crear el usuario admin:', err.message);
    }
}

app.listen(port, () => {
    console.log(`🚀 API Escuela de Fútbol corriendo en http://localhost:${port}`);
    asegurarAdmin();
});
