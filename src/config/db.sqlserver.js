const sql = require('mssql');
require('dotenv').config();

const config = {
  server:   process.env.SQLSERVER_HOST || 'localhost',
  port:     parseInt(process.env.SQLSERVER_PORT) || 1433,
  database: process.env.SQLSERVER_DATABASE || 'ControlCarrera',
  user:     process.env.SQLSERVER_USER || 'carrera_app',
  password: process.env.SQLSERVER_PASSWORD || 'Carrera2026!@#',
  options: {
    encrypt:               false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: {
    max:              5,
    min:              0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 10000,
  requestTimeout:    10000,
};

let pool = null;

const getPool = async () => {
  if (pool && pool.connected) return pool;
  try {
    pool = await new sql.ConnectionPool(config).connect();
    pool.on('error', (err) => {
      console.error('[SQLServer] Error de conexión:', err.message);
      pool = null;
    });
    return pool;
  } catch (err) {
    console.error('[SQLServer] No se pudo conectar:', err.message);
    return null;
  }
};

module.exports = { getPool, sql };
