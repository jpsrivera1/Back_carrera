/**
 * Ejecutar: $env:MYSQL_ROOT_PASS="tuPassword"; node scripts/run-mysql-setup.js
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const rootPass = process.env.MYSQL_ROOT_PASS;
if (rootPass === undefined) {
  console.error('Falta la variable MYSQL_ROOT_PASS. Ejemplo:');
  console.error('  $env:MYSQL_ROOT_PASS="tuPassword"; node scripts/run-mysql-setup.js');
  process.exit(1);
}

const SQL_FILE = path.join(__dirname, 'setup-mysql.sql');
const APP_USER = 'carrera_app';
const APP_PASS = 'Carrera2026!@#';
const APP_DB   = 'controlcarrera';

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     'localhost',
      port:     3306,
      user:     'root',
      password: rootPass,
    });
    console.log('[MySQL] Conexión exitosa como root.');

    // 1. Crear la base de datos
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${APP_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`[MySQL] Base de datos '${APP_DB}' lista.`);

    // 2. Ejecutar el SQL de tablas
    const rawSql = fs.readFileSync(SQL_FILE, 'utf8');
    const statements = rawSql
      .split(';')
      .map(s => {
        // Quitar líneas de comentario para verificar si hay SQL real
        const noComments = s.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        return { original: s.trim(), noComments };
      })
      .filter(({ noComments }) => noComments.length > 0)
      .map(({ original }) => original);

    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        const ignorable = ['ER_DB_CREATE_EXISTS', 'ER_TABLE_EXISTS_ERROR', 'ER_DUP_ENTRY'];
        if (ignorable.includes(err.code)) {
          console.warn(`[MySQL] Aviso (ignorado): ${err.message}`);
        } else {
          throw err;
        }
      }
    }
    console.log('[MySQL] Tablas creadas/verificadas.');

    // 3. Crear usuario de aplicación (MySQL 8 compatible)
    await conn.query(
      `CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED WITH caching_sha2_password BY ?`,
      [APP_USER, APP_PASS]
    ).catch(() =>
      // Si ya existe con otro plugin, actualizar contraseña
      conn.query(`ALTER USER ?@'%' IDENTIFIED WITH caching_sha2_password BY ?`, [APP_USER, APP_PASS])
    );
    console.log(`[MySQL] Usuario '${APP_USER}' listo.`);

    // 4. Otorgar permisos (sin GRANT OPTION para no requerir privilegio especial)
    await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${APP_DB}\`.* TO ?@'%'`, [APP_USER]);
    await conn.query('FLUSH PRIVILEGES');
    console.log(`[MySQL] Permisos otorgados a '${APP_USER}'.`);

    console.log('');
    console.log('=== MySQL configurado correctamente ===');
    console.log(`Base de datos : ${APP_DB}`);
    console.log(`Usuario app   : ${APP_USER}`);
    console.log(`Contraseña    : ${APP_PASS}`);

  } catch (err) {
    console.error('[MySQL] Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();
