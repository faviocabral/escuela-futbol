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
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3800;
const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-en-produccion';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// ☁️ Cliente de Supabase Storage (fotos de jugadores + comprobantes)
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// 🤖 Gemini: lectura de comprobantes de transferencia
const genai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

// Extrae los datos de un comprobante (bancos PY): devuelve objeto o null
async function extraerComprobante(buffer, mimetype) {
    if (!genai) return null;
    const prompt = `Analizá este comprobante de transferencia bancaria (Paraguay) y devolvé SOLO un JSON con estas claves:
monto (entero en guaraníes, sin puntos ni símbolos), fecha (YYYY-MM-DD), nro_comprobante, banco_origen (entidad de quien envía), remitente (nombre de quien envía), banco_destino, destinatario.
Si un dato no aparece o no se puede leer, usá null. No agregues texto fuera del JSON.`;
    const resp = await genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: prompt },
                { inlineData: { data: buffer.toString('base64'), mimeType: mimetype } },
            ],
        }],
        config: { responseMimeType: 'application/json' },
    });
    try { return JSON.parse(resp.text); } catch { return null; }
}

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

// Solo staff (admin/entrenador): los padres tienen su propio conjunto de endpoints
function soloStaff(req, res, next) {
    if (req.usuario?.rol === 'padre') {
        return res.status(403).json({ error: 'Acceso solo para personal de la escuela.' });
    }
    next();
}
const staff = [verificarToken, soloStaff];

// Solo padres con jugador vinculado
function soloPadre(req, res, next) {
    if (req.usuario?.rol !== 'padre' || !req.usuario?.jugadorId) {
        return res.status(403).json({ error: 'Acceso solo para padres/tutores.' });
    }
    next();
}
const padre = [verificarToken, soloPadre];

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

const catOut = (c) => ({ id: c.id, nombre: c.nombre, edadMin: c.edad_min, edadMax: c.edad_max, entrenadorId: c.entrenador_id, horaEntrenamiento: c.hora_entrenamiento ? String(c.hora_entrenamiento).slice(0, 5) : null });
const catIn = (c) => ({ nombre: c.nombre?.trim(), edad_min: c.edadMin ?? null, edad_max: c.edadMax ?? null, entrenador_id: c.entrenadorId ?? null, hora_entrenamiento: c.horaEntrenamiento || null });

const torOut = (t) => ({ id: t.id, nombre: t.nombre, fecha: t.fecha, lugar: t.lugar, categoriaId: t.categoria_id });
const torIn = (t) => ({ nombre: t.nombre?.trim(), fecha: t.fecha, lugar: t.lugar || null, categoria_id: t.categoriaId ?? null });

const pagoOut = (p) => ({
    id: p.id, jugadorId: p.jugador_id, mes: p.mes, anio: p.anio, monto: Number(p.monto),
    metodo: p.metodo, fechaPago: p.fecha_pago, estado: p.estado || 'confirmado',
    registradoPor: p.registrado_por || 'staff', comprobanteUrl: p.comprobante_url || null,
    nroComprobante: p.nro_comprobante || null, banco: p.banco || null, remitente: p.remitente || null,
});
const pagoIn = (p) => ({ jugador_id: p.jugadorId, mes: p.mes, anio: p.anio, monto: p.monto, metodo: p.metodo || null, fecha_pago: p.fechaPago || new Date() });

const asisOut = (a, regs = []) => ({
    id: a.id, tipo: a.tipo, fecha: a.fecha, categoriaId: a.categoria_id, torneoId: a.torneo_id,
    registros: regs.filter((r) => r.asistencia_id === a.id).map((r) => ({
        jugadorId: r.jugador_id, presente: r.presente,
        origen: r.origen || 'staff', estado: r.estado || 'confirmado',
        motivoAusencia: r.motivo_ausencia || null,
    })),
});

// ─────────────────────────────────────────────────────────────
// 🕒 Fecha/hora en Asunción (el servidor corre en UTC)
// ─────────────────────────────────────────────────────────────
const ahoraAsuncion = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Asuncion' }));
const hoyAsuncion = () => {
    const d = ahoraAsuncion();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const minAHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

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
    const payload = { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol || 'admin', jugadorId: u.jugador_id || null };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, usuario: payload });
}));

const jugPublicoOut = (j) => ({ ...jugOut(j), categoriaNombre: j.categoria_nombre || 'Sin categoría' });

// ─────────────────────────────────────────────────────────────
// 📦 CRUD GENÉRICO (jugadores, entrenadores, categorías, torneos)
// ─────────────────────────────────────────────────────────────
const crud = (ruta, tabla, salida, entrada, orden = 'id') => {
    app.get(`/api/${ruta}`, ...staff, h(async (req, res) => {
        res.json(await db(tabla).select('*').orderBy(orden).then((rows) => rows.map(salida)));
    }));
    app.post(`/api/${ruta}`, ...staff, h(async (req, res) => {
        const [row] = await db(tabla).insert(entrada(req.body)).returning('*');
        res.status(201).json(salida(row));
    }));
    app.put(`/api/${ruta}/:id`, ...staff, h(async (req, res) => {
        const [row] = await db(tabla).where({ id: req.params.id }).update(entrada(req.body)).returning('*');
        if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
        res.json(salida(row));
    }));
    app.delete(`/api/${ruta}/:id`, ...staff, h(async (req, res) => {
        await db(tabla).where({ id: req.params.id }).del();
        res.json({ ok: true });
    }));
};

// ── JUGADORES: rutas propias porque además gestionan el acceso del padre ──

// Crea/actualiza/quita el usuario padre vinculado al jugador.
// accesoPadre = { usuario, password } | { eliminar: true } | undefined
async function gestionarAccesoPadre(jugador, accesoPadre) {
    if (!accesoPadre) return;
    const existente = await db('usuarios').where({ jugador_id: jugador.id }).first();
    if (accesoPadre.eliminar) {
        if (existente) await db('usuarios').where({ id: existente.id }).del();
        return;
    }
    const { usuario, password } = accesoPadre;
    if (!usuario) return;
    const datos = { usuario: usuario.trim().toLowerCase() };
    if (password) datos.password_hash = await bcrypt.hash(password, 10);
    if (existente) {
        await db('usuarios').where({ id: existente.id }).update(datos);
    } else {
        if (!password) return; // sin password no se puede crear la cuenta
        await db('usuarios').insert({
            ...datos,
            nombre: `Padre de ${jugador.nombre} ${jugador.apellido}`,
            rol: 'padre',
            jugador_id: jugador.id,
        });
    }
}

app.get('/api/jugadores', ...staff, h(async (req, res) => {
    const rows = await db('jugadores')
        .leftJoin('usuarios', 'usuarios.jugador_id', 'jugadores.id')
        .select('jugadores.*', 'usuarios.usuario as padre_usuario')
        .orderBy('jugadores.apellido').orderBy('jugadores.nombre');
    res.json(rows.map((j) => ({ ...jugOut(j), accesoPadre: j.padre_usuario || null })));
}));

app.post('/api/jugadores', ...staff, h(async (req, res) => {
    const { accesoPadre, ...datos } = req.body;
    const [row] = await db('jugadores').insert(jugIn(datos)).returning('*');
    await gestionarAccesoPadre(row, accesoPadre);
    const acceso = await db('usuarios').where({ jugador_id: row.id }).first();
    res.status(201).json({ ...jugOut(row), accesoPadre: acceso?.usuario || null });
}));

app.put('/api/jugadores/:id', ...staff, h(async (req, res) => {
    const { accesoPadre, ...datos } = req.body;
    const [row] = await db('jugadores').where({ id: req.params.id }).update(jugIn(datos)).returning('*');
    if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
    await gestionarAccesoPadre(row, accesoPadre);
    const acceso = await db('usuarios').where({ jugador_id: row.id }).first();
    res.json({ ...jugOut(row), accesoPadre: acceso?.usuario || null });
}));

app.delete('/api/jugadores/:id', ...staff, h(async (req, res) => {
    await db('usuarios').where({ jugador_id: req.params.id }).del(); // su acceso padre no queda huérfano
    await db('jugadores').where({ id: req.params.id }).del();
    res.json({ ok: true });
}));

crud('entrenadores', 'entrenadores', (e) => e, entIn);
crud('categorias', 'categorias', catOut, catIn, 'edad_min');
crud('torneos', 'torneos', torOut, torIn, 'fecha');

// 📸 Subir foto del jugador a Supabase Storage (bucket público 'jugadores-fotos')
app.post('/api/jugadores/:id/foto', ...staff, upload.single('foto'), h(async (req, res) => {
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
app.get('/api/convocatorias', ...staff, h(async (req, res) => {
    res.json(await db('convocatorias').select('*').then((rows) => rows.map(convOut)));
}));

// Reemplaza la lista de convocados de un torneo
app.put('/api/torneos/:id/convocatoria', ...staff, h(async (req, res) => {
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
app.get('/api/asistencias', ...staff, h(async (req, res) => {
    const planillas = await db('asistencias').select('*').orderBy('fecha', 'desc');
    const registros = planillas.length
        ? await db('asistencia_registros').whereIn('asistencia_id', planillas.map((p) => p.id))
        : [];
    res.json(planillas.map((p) => asisOut(p, registros)));
}));

// Guarda (o reemplaza) una planilla: { tipo, fecha, categoriaId, torneoId, registros:[{jugadorId,presente}] }
app.post('/api/asistencias', ...staff, h(async (req, res) => {
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
                registros.map((r) => ({
                    asistencia_id: cab.id, jugador_id: r.jugadorId, presente: !!r.presente,
                    origen: r.origen || 'staff', motivo_ausencia: r.motivoAusencia || null,
                    // El staff revisa la planilla al guardarla → todo queda confirmado
                    estado: 'confirmado',
                }))
            );
        }
        return cab;
    });

    res.status(201).json(asisOut(planilla, registros.map((r) => ({ asistencia_id: planilla.id, jugador_id: r.jugadorId, presente: !!r.presente, origen: r.origen || 'staff', estado: 'confirmado', motivo_ausencia: r.motivoAusencia || null }))));
}));

// El entrenador/admin confirma las marcas pendientes de una planilla (las que cargaron los padres)
app.put('/api/asistencias/:id/confirmar', ...staff, h(async (req, res) => {
    const n = await db('asistencia_registros')
        .where({ asistencia_id: req.params.id, estado: 'pendiente' })
        .update({ estado: 'confirmado' });
    res.json({ ok: true, confirmados: n });
}));

// ─────────────────────────────────────────────────────────────
// 💰 PAGOS (staff: carga directa en efectivo → confirmado)
// ─────────────────────────────────────────────────────────────
app.get('/api/pagos', ...staff, h(async (req, res) => {
    res.json(await db('pagos').select('*').orderBy('fecha_pago', 'desc').then((rows) => rows.map(pagoOut)));
}));

app.post('/api/pagos', ...staff, h(async (req, res) => {
    try {
        const [row] = await db('pagos')
            .insert({ ...pagoIn(req.body), estado: 'confirmado', registrado_por: 'staff' })
            .returning('*');
        res.status(201).json(pagoOut(row));
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un pago vigente para ese jugador en ese período.' });
        throw e;
    }
}));

// El contador confirma un pago subido por el padre (puede corregir el monto)
app.put('/api/pagos/:id/confirmar', ...staff, h(async (req, res) => {
    const datos = { estado: 'confirmado' };
    if (req.body?.monto != null) datos.monto = req.body.monto;
    const [row] = await db('pagos').where({ id: req.params.id }).update(datos).returning('*');
    if (!row) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json(pagoOut(row));
}));

app.put('/api/pagos/:id/rechazar', ...staff, h(async (req, res) => {
    const [row] = await db('pagos').where({ id: req.params.id }).update({ estado: 'rechazado' }).returning('*');
    if (!row) return res.status(404).json({ error: 'Pago no encontrado.' });
    res.json(pagoOut(row));
}));

// URL firmada (1h) para ver el comprobante — staff o el padre dueño del pago
app.get('/api/pagos/:id/comprobante', verificarToken, h(async (req, res) => {
    const pago = await db('pagos').where({ id: req.params.id }).first();
    if (!pago || !pago.comprobante_url) return res.status(404).json({ error: 'Este pago no tiene comprobante.' });
    if (req.usuario.rol === 'padre' && pago.jugador_id !== req.usuario.jugadorId) {
        return res.status(403).json({ error: 'No podés ver comprobantes de otros jugadores.' });
    }
    const { data, error } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(pago.comprobante_url, 3600);
    if (error) return res.status(500).json({ error: `No se pudo generar el acceso: ${error.message}` });
    res.json({ url: data.signedUrl });
}));

app.delete('/api/pagos/:id', ...staff, h(async (req, res) => {
    await db('pagos').where({ id: req.params.id }).del();
    res.json({ ok: true });
}));

// ─────────────────────────────────────────────────────────────
// 👨‍👦 PORTAL DEL PADRE (rol=padre, vinculado a un jugador)
// ─────────────────────────────────────────────────────────────

// Datos de su jugador + categoría
app.get('/api/padre/jugador', ...padre, h(async (req, res) => {
    const j = await db('jugadores')
        .leftJoin('categorias', 'jugadores.categoria_id', 'categorias.id')
        .select('jugadores.*', 'categorias.nombre as categoria_nombre', 'categorias.hora_entrenamiento')
        .where({ 'jugadores.id': req.usuario.jugadorId })
        .first();
    if (!j) return res.status(404).json({ error: 'Jugador no encontrado.' });
    res.json({ ...jugPublicoOut(j), horaEntrenamiento: j.hora_entrenamiento ? String(j.hora_entrenamiento).slice(0, 5) : null });
}));

// Historial de asistencia de su jugador (últimas 30 marcas)
app.get('/api/padre/asistencias', ...padre, h(async (req, res) => {
    const rows = await db('asistencia_registros')
        .join('asistencias', 'asistencia_registros.asistencia_id', 'asistencias.id')
        .leftJoin('torneos', 'asistencias.torneo_id', 'torneos.id')
        .select(
            'asistencias.fecha', 'asistencias.tipo', 'torneos.nombre as torneo_nombre',
            'asistencia_registros.presente', 'asistencia_registros.motivo_ausencia',
            'asistencia_registros.origen', 'asistencia_registros.estado'
        )
        .where({ 'asistencia_registros.jugador_id': req.usuario.jugadorId })
        .orderBy('asistencias.fecha', 'desc')
        .limit(30);
    res.json(rows.map((r) => ({
        fecha: r.fecha, tipo: r.tipo, torneo: r.torneo_nombre,
        presente: r.presente, motivoAusencia: r.motivo_ausencia, origen: r.origen, estado: r.estado,
    })));
}));

// Marca asistencia o justifica la ausencia de hoy (o la fecha indicada)
// body: { estado: 'presente'|'ausente', motivo?, fecha? }
app.post('/api/padre/asistencia', ...padre, h(async (req, res) => {
    const { estado, motivo, fecha } = req.body || {};
    if (!['presente', 'ausente'].includes(estado)) {
        return res.status(400).json({ error: "Estado inválido: usá 'presente' o 'ausente'." });
    }
    if (estado === 'ausente' && !motivo?.trim()) {
        return res.status(400).json({ error: 'Contanos el motivo de la ausencia.' });
    }
    const j = await db('jugadores')
        .leftJoin('categorias', 'jugadores.categoria_id', 'categorias.id')
        .select('jugadores.*', 'categorias.hora_entrenamiento')
        .where({ 'jugadores.id': req.usuario.jugadorId }).first();
    if (!j) return res.status(404).json({ error: 'Jugador no encontrado.' });
    if (!j.activo) return res.status(400).json({ error: 'Este jugador figura como inactivo.' });

    // Ventana de marcado: 1h antes hasta 30 min después del inicio del entrenamiento.
    // Solo aplica a marcar PRESENCIA; justificar ausencia se permite en cualquier momento.
    if (estado === 'presente' && j.hora_entrenamiento && !fecha) {
        const [hh, mm] = String(j.hora_entrenamiento).slice(0, 5).split(':').map(Number);
        const inicio = hh * 60 + mm;
        const ahora = ahoraAsuncion();
        const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
        if (ahoraMin < inicio - 60 || ahoraMin > inicio + 30) {
            return res.status(400).json({
                error: `Fuera de horario: la asistencia se puede marcar entre ${minAHHMM(inicio - 60)} y ${minAHHMM(inicio + 30)} hs. El entrenador o el administrador puede marcarla en otro momento.`,
            });
        }
    }

    const dia = fecha || hoyAsuncion();
    let planilla = await db('asistencias')
        .where({ tipo: 'entrenamiento', categoria_id: j.categoria_id, fecha: dia }).first();
    if (!planilla) {
        [planilla] = await db('asistencias')
            .insert({ tipo: 'entrenamiento', fecha: dia, categoria_id: j.categoria_id }).returning('*');
    }

    const anterior = await db('asistencia_registros')
        .where({ asistencia_id: planilla.id, jugador_id: j.id }).first();
    if (anterior?.presente && estado === 'presente') {
        return res.json({ resultado: 'ya_marcado' });
    }

    const presente = estado === 'presente';
    await db('asistencia_registros')
        .insert({
            asistencia_id: planilla.id, jugador_id: j.id, presente,
            origen: 'padre', estado: 'pendiente',
            motivo_ausencia: presente ? null : motivo.trim(),
        })
        .onConflict(['asistencia_id', 'jugador_id'])
        .merge({ presente, origen: 'padre', estado: 'pendiente', motivo_ausencia: presente ? null : motivo.trim() });

    res.json({ resultado: anterior ? 'actualizado' : 'ok' });
}));

// Pagos de su jugador
app.get('/api/padre/pagos', ...padre, h(async (req, res) => {
    res.json(await db('pagos')
        .where({ jugador_id: req.usuario.jugadorId })
        .orderBy('anio', 'desc').orderBy('mes', 'desc')
        .then((rows) => rows.map(pagoOut)));
}));

// Subir comprobante de transferencia → Gemini extrae los datos → pago PENDIENTE
// FormData: comprobante (imagen), mes, anio, monto (opcional, si Gemini no lee)
app.post('/api/padre/pago', ...padre, upload.single('comprobante'), h(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Subí la imagen del comprobante.' });
    if (!supabase) return res.status(500).json({ error: 'Supabase Storage no configurado.' });
    const { mes, anio, monto } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: 'Indicá el mes y el año que estás pagando.' });

    // 1) Guardar la imagen en el bucket privado 'comprobantes'
    const ext = (req.file.mimetype.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const ruta = `jugador_${req.usuario.jugadorId}_${anio}-${String(mes).padStart(2, '0')}_${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage
        .from('comprobantes')
        .upload(ruta, req.file.buffer, { contentType: req.file.mimetype });
    if (errUp) return res.status(500).json({ error: `No se pudo subir el comprobante: ${errUp.message}` });

    // 2) Gemini lee la imagen (si está configurado); si falla, se crea igual para revisión manual
    let extraido = null;
    try { extraido = await extraerComprobante(req.file.buffer, req.file.mimetype); }
    catch (e) { console.error('⚠️ Gemini no pudo leer el comprobante:', e.message); }

    // 3) Crear el pago pendiente de confirmación
    try {
        const [row] = await db('pagos').insert({
            jugador_id: req.usuario.jugadorId,
            mes: Number(mes), anio: Number(anio),
            monto: extraido?.monto || Number(monto) || 0,
            metodo: 'Transferencia',
            fecha_pago: extraido?.fecha || new Date().toISOString().slice(0, 10),
            estado: 'pendiente',
            registrado_por: 'padre',
            comprobante_url: ruta,
            nro_comprobante: extraido?.nro_comprobante || null,
            banco: extraido?.banco_origen || null,
            remitente: extraido?.remitente || null,
        }).returning('*');
        res.status(201).json({ pago: pagoOut(row), extraido });
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un pago vigente para ese período. Si fue rechazado, consultá con la escuela.' });
        }
        throw e;
    }
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
