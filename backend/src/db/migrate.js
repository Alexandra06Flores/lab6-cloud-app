// Ejecuta db/init.sql contra la base de datos configurada en .env
// Uso: node src/db/migrate.js  (o npm run migrate)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const sqlPath = path.join(__dirname, '..', '..', '..', 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('Esquema creado correctamente (tablas admins y users).');
  } catch (err) {
    console.error('Error ejecutando la migración:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();