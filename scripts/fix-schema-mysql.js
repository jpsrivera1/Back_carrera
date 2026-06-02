/**
 * fix-schema-mysql.js
 * Agrega columnas faltantes en MySQL que existen en Supabase.
 * Requiere MYSQL_ROOT_PASSWORD en .env
 * Uso: node scripts/fix-schema-mysql.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const DB = process.env.MYSQL_DATABASE || 'controlcarrera';

const COLUMNAS_FALTANTES = [
  { tabla: 'participantes', col: 'fecha_registro',  tipo: 'DATETIME NULL' },
  { tabla: 'participantes', col: 'estado_pago',     tipo: "VARCHAR(20) NULL" },
];

async function columnExists(pool, tabla, col) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB, tabla, col]
  );
  return rows.length > 0;
}

async function main() {
  const rootPwd = process.env.MYSQL_ROOT_PASSWORD;
  if (rootPwd === undefined) {
    console.error('❌ Falta MYSQL_ROOT_PASSWORD en .env');
    process.exit(1);
  }

  const pool = await mysql.createPool({
    host:     process.env.MYSQL_HOST || '127.0.0.1',
    port:     parseInt(process.env.MYSQL_PORT) || 3306,
    database: DB,
    user:     'root',
    password: rootPwd,
  });

  console.log('\n🔧 Verificando schema MySQL...\n');

  for (const { tabla, col, tipo } of COLUMNAS_FALTANTES) {
    const existe = await columnExists(pool, tabla, col);
    if (existe) {
      console.log(`ℹ️  ${tabla}.${col} — ya existe`);
    } else {
      await pool.query(`ALTER TABLE \`${tabla}\` ADD COLUMN \`${col}\` ${tipo}`);
      console.log(`✅ ${tabla}.${col} — columna agregada`);
    }
  }

  // Mostrar estructura actualizada de participantes
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'participantes'
     ORDER BY ORDINAL_POSITION`,
    [DB]
  );
  console.log('\n📋 Estructura actual de participantes en MySQL:');
  cols.forEach(c => console.log(`  ${c.COLUMN_NAME.padEnd(25)} ${c.COLUMN_TYPE.padEnd(20)} nullable=${c.IS_NULLABLE}`));

  await pool.end();
  console.log('\n✅ Schema corregido. Ahora ejecuta: node scripts/verify-sync.js --fix\n');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
