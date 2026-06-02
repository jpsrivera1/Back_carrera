/**
 * verify-sync.js
 * Verifica y re-sincroniza todas las tablas desde Supabase → MySQL y SQL Server.
 * Uso: node scripts/verify-sync.js
 *      node scripts/verify-sync.js --fix   (re-sincroniza los faltantes)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient }          = require('@supabase/supabase-js');
const mysql                     = require('mysql2/promise');
const sql                       = require('mssql');

const FIX_MODE = process.argv.includes('--fix');

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── MySQL ────────────────────────────────────────────────────────────────────
async function getMysqlPool() {
  return mysql.createPool({
    host:               process.env.MYSQL_HOST     || '127.0.0.1',
    port:               parseInt(process.env.MYSQL_PORT) || 3306,
    database:           process.env.MYSQL_DATABASE || 'controlcarrera',
    user:               process.env.MYSQL_USER     || 'carrera_app',
    password:           process.env.MYSQL_PASSWORD || 'Carrera2026!@#',
    waitForConnections: true,
    connectionLimit:    5,
    timezone:           '+00:00',
  });
}

// ─── SQL Server ───────────────────────────────────────────────────────────────
async function getMssqlPool() {
  return new sql.ConnectionPool({
    server:   process.env.SQLSERVER_HOST     || 'localhost',
    port:     parseInt(process.env.SQLSERVER_PORT) || 1433,
    database: process.env.SQLSERVER_DATABASE || 'ControlCarrera',
    user:     process.env.SQLSERVER_USER     || 'carrera_app',
    password: process.env.SQLSERVER_PASSWORD || 'Carrera2026!@#',
    options:  { encrypt: false, trustServerCertificate: true },
    connectionTimeout: 10000,
    requestTimeout:    15000,
  }).connect();
}

// ─── Tablas a verificar ───────────────────────────────────────────────────────
const TABLAS = [
  'participantes',
  'pagos',
  'kits',
  'usuarios',
  'alumnos_vendedores',
  'boletos_preventa',
];

// ─── Contar filas ─────────────────────────────────────────────────────────────
async function contarSupabase(tabla) {
  const { count, error } = await supabase
    .from(tabla)
    .select('*', { count: 'exact', head: true });
  if (error) return { count: null, error: error.message };
  return { count };
}

async function contarMySQL(pool, tabla) {
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${tabla}\``);
    return { count: rows[0].total };
  } catch (e) {
    return { count: null, error: e.message };
  }
}

async function contarMSSQL(pool, tabla) {
  try {
    const result = await pool.request().query(`SELECT COUNT(*) AS total FROM [${tabla}]`);
    return { count: result.recordset[0].total };
  } catch (e) {
    return { count: null, error: e.message };
  }
}

// ─── Obtener todos los datos de Supabase ──────────────────────────────────────
async function fetchSupabase(tabla) {
  let all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase [${tabla}]: ${error.message}`);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ─── Obtener columnas reales de MySQL ────────────────────────────────────────
const mysqlColumnsCache = {};
async function getMysqlColumns(pool, tabla) {
  if (mysqlColumnsCache[tabla]) return mysqlColumnsCache[tabla];
  const db = process.env.MYSQL_DATABASE || 'controlcarrera';
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
    [db, tabla]
  );
  mysqlColumnsCache[tabla] = rows.map(r => r.COLUMN_NAME);
  return mysqlColumnsCache[tabla];
}

// ─── Upsert MySQL ─────────────────────────────────────────────────────────────
async function upsertMySQL(pool, tabla, rows) {
  if (!rows.length) return 0;
  const mysqlCols = await getMysqlColumns(pool, tabla);
  let ok = 0;
  for (const row of rows) {
    // Solo usar columnas que existan en MySQL
    const cols = Object.keys(row).filter(c => mysqlCols.includes(c));
    const vals = cols.map(c => row[c] === undefined ? null : row[c]);
    const colStr = cols.map(c => `\`${c}\``).join(', ');
    const phStr  = cols.map(() => '?').join(', ');
    const updStr = cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
    try {
      await pool.query(
        `INSERT INTO \`${tabla}\` (${colStr}) VALUES (${phStr})
         ON DUPLICATE KEY UPDATE ${updStr}`,
        vals
      );
      ok++;
    } catch (e) {
      console.error(`  [MySQL] Error en ${tabla} id=${row.id}: ${e.message}`);
    }
  }
  return ok;
}

// ─── Upsert SQL Server ────────────────────────────────────────────────────────
async function upsertMSSQL(pool, tabla, rows) {
  if (!rows.length) return 0;
  let ok = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    const req  = pool.request();
    cols.forEach((c, i) => {
      const v = row[c];
      req.input(`p${i}`, v === undefined ? null : v);
    });

    // Construir SET dinámico excluyendo la PK (id)
    const pk   = cols[0]; // primer campo = id
    const sets = cols
      .filter(c => c !== pk)
      .map((c, i) => {
        const idx = cols.indexOf(c);
        return `[${c}] = @p${idx}`;
      })
      .join(', ');

    const colStr = cols.map(c => `[${c}]`).join(', ');
    const valStr = cols.map((_, i) => `@p${i}`).join(', ');

    const query = `
      IF EXISTS (SELECT 1 FROM [${tabla}] WHERE [${pk}] = @p0)
        UPDATE [${tabla}] SET ${sets} WHERE [${pk}] = @p0
      ELSE
        INSERT INTO [${tabla}] (${colStr}) VALUES (${valStr})`;

    try {
      await req.query(query);
      ok++;
    } catch (e) {
      console.error(`  [SQL Server] Error en ${tabla} id=${row[pk]}: ${e.message}`);
    }
  }
  return ok;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  VERIFICACIÓN DE SINCRONIZACIÓN — Supabase → Local');
  console.log(`  Modo: ${FIX_MODE ? '⚡ RE-SINCRONIZAR (--fix)' : '🔍 SOLO LECTURA'}`);
  console.log('════════════════════════════════════════════════════════\n');

  // Conectar
  let mysqlPool  = null;
  let mssqlPool  = null;

  try {
    mysqlPool = await getMysqlPool();
    console.log('✅ MySQL     conectado');
  } catch (e) {
    console.log(`❌ MySQL     SIN CONEXIÓN: ${e.message}`);
  }

  try {
    mssqlPool = await getMssqlPool();
    console.log('✅ SQL Server conectado');
  } catch (e) {
    console.log(`❌ SQL Server SIN CONEXIÓN: ${e.message}`);
  }

  console.log('✅ Supabase  conectado\n');

  // ── Tabla de conteos ─────────────────────────────────────────────────────
  console.log('┌──────────────────────┬──────────┬──────────┬──────────────┬────────┐');
  console.log('│ Tabla                │ Supabase │  MySQL   │  SQL Server  │ Estado │');
  console.log('├──────────────────────┼──────────┼──────────┼──────────────┼────────┤');

  const desincronizadas = [];

  for (const tabla of TABLAS) {
    const sb  = await contarSupabase(tabla);
    const my  = mysqlPool  ? await contarMySQL(mysqlPool, tabla)   : { count: null, error: 'Sin conexión' };
    const ms  = mssqlPool  ? await contarMSSQL(mssqlPool, tabla)   : { count: null, error: 'Sin conexión' };

    const sbN = sb.count  ?? 'ERR';
    const myN = my.count  ?? 'ERR';
    const msN = ms.count  ?? 'ERR';

    const sincMySQL = sb.count !== null && my.count !== null && sb.count === my.count;
    const sincMSSQL = sb.count !== null && ms.count !== null && sb.count === ms.count;
    const estado    = sincMySQL && sincMSSQL ? ' ✅ OK ' : ' ⚠️ DIFF';

    if (!sincMySQL || !sincMSSQL) {
      desincronizadas.push({ tabla, sbN, myN, msN, sincMySQL, sincMSSQL });
    }

    const pad = (v, n) => String(v).padStart(n);
    console.log(
      `│ ${tabla.padEnd(20)} │ ${pad(sbN,8)} │ ${pad(myN,8)} │ ${pad(msN,12)} │${estado}│`
    );
  }

  console.log('└──────────────────────┴──────────┴──────────┴──────────────┴────────┘\n');

  if (desincronizadas.length === 0) {
    console.log('✅ TODOS LOS DATOS ESTÁN SINCRONIZADOS.\n');
    process.exit(0);
  }

  console.log(`⚠️  ${desincronizadas.length} tabla(s) con diferencias:\n`);
  desincronizadas.forEach(t => {
    console.log(`  • ${t.tabla}: Supabase=${t.sbN} | MySQL=${t.myN} ${t.sincMySQL ? '✅' : '❌'} | SQLServer=${t.msN} ${t.sincMSSQL ? '✅' : '❌'}`);
  });

  if (!FIX_MODE) {
    console.log('\n💡 Ejecuta con --fix para re-sincronizar los datos faltantes:');
    console.log('   node scripts/verify-sync.js --fix\n');
    process.exit(0);
  }

  // ── Modo FIX: re-sincronizar ───────────────────────────────────────────────
  console.log('\n⚡ Iniciando re-sincronización...\n');

  for (const { tabla, sincMySQL: okMy, sincMSSQL: okMs } of desincronizadas) {
    console.log(`📦 Cargando [${tabla}] desde Supabase...`);
    let filas;
    try {
      filas = await fetchSupabase(tabla);
      console.log(`   ${filas.length} registros obtenidos`);
    } catch (e) {
      console.error(`   ❌ Error al leer Supabase: ${e.message}`);
      continue;
    }

    if (!okMy && mysqlPool) {
      console.log(`   → Sincronizando MySQL...`);
      const n = await upsertMySQL(mysqlPool, tabla, filas);
      console.log(`   ✅ MySQL: ${n}/${filas.length} registros sincronizados`);
    }

    if (!okMs && mssqlPool) {
      console.log(`   → Sincronizando SQL Server...`);
      const n = await upsertMSSQL(mssqlPool, tabla, filas);
      console.log(`   ✅ SQL Server: ${n}/${filas.length} registros sincronizados`);
    }
    console.log();
  }

  // ── Verificación final ────────────────────────────────────────────────────
  console.log('═══ VERIFICACIÓN FINAL ══════════════════════════════════\n');
  for (const tabla of TABLAS) {
    const sb = await contarSupabase(tabla);
    const my = mysqlPool ? await contarMySQL(mysqlPool, tabla)  : { count: null };
    const ms = mssqlPool ? await contarMSSQL(mssqlPool, tabla)  : { count: null };
    const ok = sb.count === my.count && sb.count === ms.count;
    console.log(
      `  ${ok ? '✅' : '❌'} ${tabla.padEnd(22)} Supabase=${sb.count} | MySQL=${my.count ?? 'N/A'} | SQLServer=${ms.count ?? 'N/A'}`
    );
  }

  console.log('\n✅ Re-sincronización completada.\n');
  if (mysqlPool) await mysqlPool.end();
  if (mssqlPool) await mssqlPool.close();
  process.exit(0);
}

main().catch(e => {
  console.error('\n❌ Error fatal:', e.message);
  process.exit(1);
});
