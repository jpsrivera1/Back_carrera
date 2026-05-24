const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const getPool = async () => {
  if (pool) return pool;
  try {
    pool = await mysql.createPool({
      host:               process.env.MYSQL_HOST     || '127.0.0.1',
      port:               parseInt(process.env.MYSQL_PORT) || 3306,
      database:           process.env.MYSQL_DATABASE || 'controlcarrera',
      user:               process.env.MYSQL_USER     || 'carrera_app',
      password:           process.env.MYSQL_PASSWORD || 'Carrera2026!@#',
      waitForConnections: true,
      connectionLimit:    5,
      connectTimeout:     10000,
      timezone:           '+00:00',
    });
    // Verificar conectividad al inicio
    const conn = await pool.getConnection();
    conn.release();
    return pool;
  } catch (err) {
    console.error('[MySQL] No se pudo conectar:', err.message);
    pool = null;
    return null;
  }
};

module.exports = { getPool };
