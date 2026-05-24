const mysql = require('mysql2/promise');

(async () => {
  const rootPass = process.env.MYSQL_ROOT_PASS;
  if (!rootPass && rootPass !== '') {
    console.error('Falta MYSQL_ROOT_PASS');
    process.exit(1);
  }

  const c = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: rootPass });

  const users = ["'carrera_app'@'%'", "'carrera_app'@'localhost'", "'carrera_app'@'127.0.0.1'"];

  for (const u of users) {
    // Crear si no existe
    await c.query(
      `CREATE USER IF NOT EXISTS ${u} IDENTIFIED WITH mysql_native_password BY 'Carrera2026!@#'`
    ).catch(() => {});

    // Asegurarse del plugin y password correctos
    await c.query(
      `ALTER USER ${u} IDENTIFIED WITH mysql_native_password BY 'Carrera2026!@#'`
    ).catch(e => console.warn(`  Aviso en ${u}: ${e.message}`));

    // Otorgar permisos
    await c.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON \`controlcarrera\`.* TO ${u}`
    ).catch(e => console.warn(`  Aviso grant ${u}: ${e.message}`));

    console.log(`  OK: ${u}`);
  }

  await c.query('FLUSH PRIVILEGES');
  console.log('Usuarios MySQL configurados correctamente.');
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
