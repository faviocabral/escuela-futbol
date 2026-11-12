import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import knexConfig from 'knex';
import sharp from 'sharp';
import 'dotenv/config';
import fs, { promises as fsPromises } from 'node:fs';
import path from 'path';
import https from 'node:https';

const app = express();
const port = 3800;

// Configurar Multer para aceptar hasta 30 archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
});

// 🗄️ CONEXIÓN A POSTGRESQL VÍA KNEX
const db = knexConfig({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || 'localhost', // Pon 'db' si usas Docker Compose
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'tu_password',
        database: process.env.DB_NAME || 'tu_base_datos',
    },
    pool: { min: 2, max: 20 }
});

// Asegura que exista la carpeta para guardar los previews locales
if (!fs.existsSync('./public/previews')) { 
    fs.mkdirSync('./public/previews', { recursive: true }); 
}

// 🌐 Le decimos a Express que todo lo que esté en /public se pueda abrir desde el navegador
app.use('/previews', express.static('./public/previews'));


const responseSchemaFactura = {
    type: 'OBJECT',
    properties: {
        proveedor: { type: 'STRING' },
        ruc_proveedor: { type: 'STRING' },
        timbrado: { type: 'STRING' },
        fecha: { type: 'STRING' },
        factura_numero: { type: 'STRING' },
        gravado_10: { type: 'NUMBER' },
        iva_10: { type: 'NUMBER' },
        gravado_5: { type: 'NUMBER' },
        iva_5: { type: 'NUMBER' },
        total: { type: 'NUMBER' },
        es_electronica: { type: 'BOOLEAN' },
        condicion_pago: { type: 'STRING' }
    },
    required: [
        'proveedor', 'ruc_proveedor', 'timbrado', 'fecha',
        'factura_numero', 'gravado_10', 'iva_10', 'gravado_5',
        'iva_5', 'total', 'es_electronica', 'condicion_pago'
    ]
};

function verificarTokenSeguridad(req, res, next) {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        console.warn("🛑 Intento de acceso bloqueado: Falta el token de seguridad.");
        return res.status(401).json({ error: 'Acceso no autorizado. Falta el token Bearer en los headers.' });
    }
    const tokenRecibido = authorizationHeader.split(' ')[1];
    if (tokenRecibido !== process.env.API_SECRET_TOKEN) {
        console.warn("🛑 Intento de acceso bloqueado: Token inválido proporcionado.");
        return res.status(403).json({ error: 'Acceso prohibido. El token proporcionado es inválido.' });
    }
    next();
}


/**
 * Lógica con reintento exponencial automático corregida (*= 2)
 */
async function generarContenidoConReintento(payload, maxIntentos = 3, esperaInicial = 3000) {
    let intento = 0;
    let tiempoEspera = esperaInicial;
    while (intento < maxIntentos) {
        try {
            intento++;
            return await ai.models.generateContent(payload);
        } catch (error) {
            const esErrorServidor = error.status === 503 || error.status === 429 || error.message?.includes('503') || error.message?.includes('429');
            if (esErrorServidor && intento < maxIntentos) {
                console.warn(`⚠️ Servidor saturado/Rate Limit. Reintentando en ${tiempoEspera / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, tiempoEspera));
                tiempoEspera *= 2; 
            } else {
                throw error;
            }
        }
    }
}

/**
 * 🗄️ Inserción masiva ultra rápida con Knex
 */
async function guardarLoteEnBaseDatos(listaDatos, idCliente) {
    if (!listaDatos || listaDatos.length === 0) return;
    try {
        console.log(`📝 Insertando lote de ${listaDatos.length} facturas usando Knex...`);
        const registrosLimpios = listaDatos.map(factura => ({
            id_cliente: idCliente,
            archivo_nombre: factura.archivo_nombre,
            url_preview: factura.url_preview || null,
            proveedor: factura.proveedor || null,
            ruc_proveedor: factura.ruc_proveedor || null,
            timbrado: factura.timbrado || null,
            fecha: factura.fecha || null,
            factura_numero: factura.factura_numero || null,
            gravado_10: factura.gravado_10 ?? 0,
            iva_10: factura.iva_10 ?? 0,
            gravado_5: factura.gravado_5 ?? 0,
            iva_5: factura.iva_5 ?? 0,
            total: factura.total ?? 0,
            es_electronica: factura.es_electronica ?? false,
            condicion_pago: factura.condicion_pago || null
        }));

        await db.transaction(async (trx) => {
            await trx.batchInsert('public.facturas', registrosLimpios, 30);
        });
        console.log(`💾 Inserción exitosa en PostgreSQL.`);
    } catch (err) {
        console.error("❌ Error crítico en la inserción con Knex:", err.message);
        throw err;
    }
}

async function procesarFacturaIndividual(file) {
    const idUnico = Math.random().toString(36).substring(7); // Para identificar la factura en los logs masivos
    console.log(`\n=== 🚀 INICIO PROCESAMIENTO [${idUnico}] ===`);
    console.time(`⏱️ [${idUnico}] Tiempo Total Función`);    
    try {
        // 1. MEDIR COMPRESIÓN CON SHARP
        console.time(`  ↳ 🖼️ [${idUnico}] Sharp (Optimizar Imagen)`);        
        // Redimensionamiento óptimo para legibilidad y peso de red
        const bufferOptimizado = await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        console.timeEnd(`  ↳ 🖼️ [${idUnico}] Sharp (Optimizar Imagen)`);
        
        let urlPublicaImagen = '';

        if (process.env.NODE_ENV === 'production') {
            // 🌐 PRODUCCIÓN: Subida directa al Storage de Supabase
            const nombreArchivoUnico = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
            const { data: uploadData, error: uploadError } = await 
            supabase.storage
                .from('facturas-bucket')
                .upload(nombreArchivoUnico, bufferOptimizado, { contentType: 'image/jpeg' });

            if (uploadError) throw new Error(`Error Supabase: ${uploadError.message}`);

            const { data: urlData } = supabase.storage.from('facturas-bucket').getPublicUrl(nombreArchivoUnico);
            urlPublicaImagen = urlData.publicUrl; // URL en la nube de Supabase
        } else {

            // 2. MEDIR ESCRITURA EN DISCO (DOCKER VIRTUAL)
            console.time(`  ↳ 💾 [${idUnico}] Disco (fs.writeFile local)`);            
            // 💻 DESARROLLO LOCAL: Escritura en tu máquina física vía volumen de Docker
            // 📝 SIMULACIÓN DE ALMACENAMIENTO LOCAL
            const nombreArchivoUnico = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
            const rutaFisicaGuardado = `./public/previews/${nombreArchivoUnico}`;
            // fs.writeFile(rutaFisicaGuardado, bufferOptimizado, (err) => {
            //     if (err) console.error("⚠️ Error escribiendo preview local:", err.message);
            // });            
            await fsPromises.writeFile(rutaFisicaGuardado, bufferOptimizado);
            urlPublicaImagen = `http://localhost:3800/previews/${nombreArchivoUnico}`; // URL local
            console.timeEnd(`  ↳ 💾 [${idUnico}] Disco (fs.writeFile local)`);
        }

        // El objeto final que retorna la función usará 'url_preview: urlPublicaImagen' de forma automática

        const imagenBase64 = {
            inlineData: {
                data: bufferOptimizado.toString("base64"),
                mimeType: "image/jpeg"
            }
        };

        // 3. MEDIR LATENCIA REAL DE GEMINI
        console.time(`  ↳ 🤖 [${idUnico}] API Gemini 2.5 Flash`);
        const payload = {
            model: 'gemini-2.5-flash',
            contents: [imagenBase64],
            config: {
                systemInstruction: "Eres un sistema experto en contabilidad. Tu única tarea es extraer con precisión matemática y estricta fidelidad los datos del documento de factura provisto. Si un valor numérico obligatorio no existe en la imagen o está en blanco, pon 0.",
                temperature: 0,
                responseMimeType: 'application/json',
                responseSchema: responseSchemaFactura
            }
        };
        const resultado = await generarContenidoConReintento(payload);
        const datosIA = JSON.parse(resultado.text);
        console.timeEnd(`  ↳ 🤖 [${idUnico}] API Gemini 2.5 Flash`);
        console.timeEnd(`⏱️ [${idUnico}] Tiempo Total Función`);
        console.log(`=== 🏁 FIN PROCESAMIENTO [${idUnico}] ===\n`);

        return {
            archivo_nombre: file.originalname,
            url_preview: urlPublicaImagen,
            ...datosIA
        };

    } catch (error) {
        console.error(`❌ Error en archivo ${file.originalname}:`, error.message);
        if (error.cause) { console.error(`👉 CAUSA REAL DEL FETCH:`, error.cause); }
        return { 
            error: true, 
            archivo_nombre: file.originalname, 
            detalle: error.message 
        };
    }
}

/**
 * ENDPOINT MULTI-FACTURA PARALELO AUTOMATIZADO CON VÍNCULO DE CLIENTE
 */
app.post('/api/procesar-factura', verificarTokenSeguridad, upload.array('facturas', 30), async (req, res) => {
    try {
        // 🔍 1. Capturamos el id_cliente que viene desde el formulario (form-data)
        const idCliente = req.body.id_cliente;

        // Validamos que el cliente envíe el ID de forma obligatoria
        if (!idCliente) {
            return res.status(400).json({ error: 'Falta el parámetro obligatorio "id_cliente" en el body.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Sube una o más imágenes usando la llave "facturas".' });
        }

        console.log(`🚀 Iniciando procesamiento en paralelo de ${req.files.length} facturas para el Cliente ID: ${idCliente}...`);

        const promesas = req.files.map(file => procesarFacturaIndividual(file));
        const resultadosTotales = await Promise.all(promesas);

        const exitosos = resultadosTotales.filter(r => !r.error);
        const fallidos = resultadosTotales.filter(r => r.error);

        // 🚀 2. Enviamos los datos exitosos y el idCliente a la función de Knex
        if (exitosos.length > 0) {
            await guardarLoteEnBaseDatos(exitosos, idCliente);
        }

        return res.status(200).json({
            mensaje: `Proceso finalizado. Exitosos: ${exitosos.length}, Fallidos: ${fallidos.length}`,
            procesados: exitosos,
            errores: fallidos
        });

    } catch (error) {
        console.error("❌ Error crítico en endpoint:", error.message);
        return res.status(500).json({ error: 'Error interno del servidor al procesar el lote.' });
    }
});

/**
 * 📊 ENDPOINT PARA LISTAR FACTURAS PAGINADAS (CON O SIN FILTRO DE CLIENTE)
 * URL de ejemplo: /api/facturas/paginadas?page=1&limit=10&id_cliente=1
 */
app.get('/api/facturas/paginadas', verificarTokenSeguridad, async (req, res) => {
    try {
        // 1. Capturamos los parámetros de la URL y definimos valores por defecto
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const idCliente = req.query.id_cliente; // Opcional: por si quieres filtrar por cliente 

        // Calcular el punto de partida (desplazamiento) para la base de datos
        const offset = (page - 1) * limit;

        console.log(`📋 Consultando facturas paginadas: Página ${page}, Límite ${limit}...`);

        // 2. Construimos la consulta base con Knex
        const queryBase = db('public.facturas');
        const countBase = db('public.facturas').count('id as total');

        // Si el frontend envía un id_cliente, aplicamos el filtro en ambas consultas
        if (idCliente) {
            queryBase.where('id_cliente', idCliente);
            countBase.where('id_cliente', idCliente);
        }

        // 3. Ejecutamos de forma simultánea la consulta de datos y el conteo total
        const [totalResultado, facturas] = await Promise.all([
            countBase.first(),
            queryBase.select('*')
                .orderBy('id', 'desc')
                .limit(limit)
                .offset(offset)
        ]);

        const totalRegistros = parseInt(totalResultado.total);
        const totalPaginas = Math.ceil(totalRegistros / limit);

        // 4. Devolvemos la estructura perfecta para el frontend
        return res.status(200).json({
            data: facturas, // El arreglo de facturas para renderizar en la tabla
            pagination: {
                total_registros: totalRegistros,
                total_paginas: totalPaginas,
                pagina_actual: page,
                limite_por_pagina: limit,
                tiene_pagina_anterior: page > 1,
                tiene_pagina_siguiente: page < totalPaginas
            }
        });

    } catch (error) {
        console.error("❌ Error en el endpoint de facturas paginadas:", error.message);
        return res.status(500).json({ error: 'Error interno del servidor al consultar el listado paginado.' });
    }
});


/**
 * 🏢 ENDPOINT PARA REGISTRAR UN NUEVO CLIENTE
 * Recibe un JSON en el body con: nombre, ruc (opcional) y telefono (opcional)
 */
app.post('/api/clientes', verificarTokenSeguridad, express.json(), async (req, res) => {
    try {
        const { nombre, ruc, telefono } = req.body;

        // Validación estricta del campo obligatorio
        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({ error: 'El campo "nombre" es obligatorio.' });
        }

        console.log(`🏢 Registrando nuevo cliente en el sistema: ${nombre}...`);

        // Insertamos en PostgreSQL y recuperamos el ID generado
        const [nuevoCliente] = await db('public.clientes')
            .insert({
                nombre: nombre.trim(),
                ruc: ruc ? ruc.trim() : null,
                telefono: telefono ? telefono.trim() : null
            })
            .returning(['id', 'nombre', 'ruc', 'telefono', 'creado_en']);

        return res.status(201).json({
            mensaje: 'Cliente registrado exitosamente.',
            cliente: nuevoCliente
        });

    } catch (error) {
        console.error("❌ Error al registrar cliente en PostgreSQL:", error.message);
        return res.status(500).json({ error: 'Error interno del servidor al guardar el cliente.' });
    }
});

/**
 * 🏢 ENDPOINT PARA LISTAR CLIENTES PAGINADOS (CON BUSCADOR OPCIONAL)
 * URL de ejemplo: /api/clientes/paginadas?page=1&limit=10&buscar=Alianza
 */
app.get('/api/clientes/paginadas', verificarTokenSeguridad, async (req, res) => {
    try {
        // 1. Parámetros de paginación y búsqueda
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const buscar = req.query.buscar ? req.query.buscar.trim() : null;

        const offset = (page - 1) * limit;

        console.log(`📋 Consultando clientes paginados: Página ${page}, Límite ${limit}...`);

        // 2. Definición de consultas base con Knex
        const queryBase = db('public.clientes');
        const countBase = db('public.clientes').count('id as total');

        // Si viene un término de búsqueda, filtramos por Nombre o RUC de forma insensible a mayúsculas (ILIKE)
        if (buscar) {
            queryBase.where(function() {
                this.where('nombre', 'ILIKE', `%${buscar}%`)
                    .orWhere('ruc', 'ILIKE', `%${buscar}%`);
            });
            countBase.where(function() {
                this.where('nombre', 'ILIKE', `%${buscar}%`)
                    .orWhere('ruc', 'ILIKE', `%${buscar}%`);
            });
        }

        // 3. Ejecución en paralelo del conteo total y los registros de la página
        const [totalResultado, clientes] = await Promise.all([
            countBase.first(),
            queryBase.select('id', 'nombre', 'ruc', 'telefono', 'creado_en')
                .orderBy('nombre', 'asc') // Orden alfabético idóneo para listas de clientes
                .limit(limit)
                .offset(offset)
        ]);

        const totalRegistros = parseInt(totalResultado.total);
        const totalPaginas = Math.ceil(totalRegistros / limit);

        // 4. Estructura unificada para el consumo del Frontend
        return res.status(200).json({
            data: clientes,
            pagination: {
                total_registros: totalRegistros,
                total_paginas: totalPaginas,
                pagina_actual: page,
                limite_por_pagina: limit,
                tiene_pagina_anterior: page > 1,
                tiene_pagina_siguiente: page < totalPaginas
            }
        });

    } catch (error) {
        console.error("❌ Error en el endpoint de clientes paginados:", error.message);
        return res.status(500).json({ error: 'Error interno del servidor al consultar los clientes.' });
    }
});


app.listen(port, () => {
    console.log(`🚀 Servidor multi-paralelo de alto rendimiento corriendo en http://localhost:${port}`);
});
