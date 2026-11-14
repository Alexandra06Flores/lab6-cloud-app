// Crea el usuario administrador inicial.
// Uso: node src/db/seed.js  (o npm run seed)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const username = process.env.ADMIN_USER || 'admin';
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(plainPassword, 10);

  try {
    await pool.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, hash]
    );
    console.log(`Admin creado/actualizado: usuario="${username}", password="${plainPassword}"`);
    console.log('IMPORTANTE: cambia esta contraseña antes de usarlo en producción.');
  } catch (err) {
    console.error('Error creando admin:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
