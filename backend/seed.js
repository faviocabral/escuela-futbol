// Crea el usuario admin inicial. Ejecutar una vez: npm run seed
import 'dotenv/config';
import knexConfig from 'knex';
import bcrypt from 'bcryptjs';

const db = knexConfig({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'escuela_futbol',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
});

const USUARIO = process.env.SEED_USUARIO || 'admin';
const PASSWORD = process.env.SEED_PASSWORD || 'admin123';

const existe = await db('usuarios').where({ usuario: USUARIO }).first();
if (existe) {
  console.log(`El usuario "${USUARIO}" ya existe.`);
} else {
  await db('usuarios').insert({
    usuario: USUARIO,
    password_hash: await bcrypt.hash(PASSWORD, 10),
    nombre: 'Administrador',
  });
  console.log(`✅ Usuario creado: ${USUARIO} / ${PASSWORD} (cambiar después del primer ingreso)`);
}

await db.destroy();
