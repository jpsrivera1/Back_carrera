/**
 * run-mysql-migrate.js
 * Ejecuta scripts/migrate-mysql.sql en la base de datos MySQL controlcarrera.
 * Uso: node scripts/run-mysql-migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function run() {
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
  if (rootPassword === undefined) {
    console.error(
      '\n✗ Falta MYSQL_ROOT_PASSWORD en el archivo .env\n' +
      '  Agrega la línea: MYSQL_ROOT_PASSWORD=tuPasswordDeRoot\n' +
      '  Si root no tiene contraseña deja: MYSQL_ROOT_PASSWORD=\n'
    );
    process.exit(1);
  }

  const rootConn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || '127.0.0.1',
    port:     parseInt(process.env.MYSQL_PORT || '3306'),
    user:     'root',
    password: rootPassword,
    database: process.env.MYSQL_DATABASE || 'controlcarrera',
    multipleStatements: true,
  });

  console.log('✓ Conectado a MySQL como root');

  const sql = fs.readFileSync(path.join(__dirname, 'migrate-mysql.sql'), 'utf8');

  // Filtrar líneas de comentarios y dividir por ;
  const statements = sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await rootConn.query(stmt);
      // Mostrar solo las primeras palabras del statement para log limpio
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
      console.log(`  ✓ ${preview}...`);
    } catch (err) {
      console.error(`  ✗ Error en statement:\n    ${stmt.substring(0, 80)}\n    → ${err.message}`);
      // No abortamos — continuamos con los demás statements
    }
  }

  await rootConn.end();
  console.log('\n✓ Migración MySQL completada.');
}

run().catch((err) => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
