/**
 * Servicio de replicación multi-base de datos.
 *
 * Estrategia: fire-and-forget asíncrono.
 * Si SQL Server o MySQL no están disponibles, se registra el error
 * en consola pero NO interrumpe la operación principal en Supabase.
 *
 * Tablas replicadas: participantes | pagos | kits | usuarios
 * Operaciones:       upsert (INSERT / UPDATE) | remove (DELETE)
 */

const { getPool: getSQLPool, sql } = require('../config/db.sqlserver');
const { getPool: getMySQLPool }    = require('../config/db.mysql');

// ─── SQL Server ───────────────────────────────────────────────────────────────

const sqlserverUpserts = {
  participantes: (r) => ({
    query: `
      MERGE participantes AS target
      USING (VALUES (@id,@nc,@nom,@cat,@tal,@est,@fi))
            AS source(id, numero_corredor, nombre_completo, categoria, talla_tshirt, estado, fecha_inscripcion)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET numero_corredor=source.numero_corredor, nombre_completo=source.nombre_completo,
                   categoria=source.categoria, talla_tshirt=source.talla_tshirt,
                   estado=source.estado, fecha_inscripcion=source.fecha_inscripcion
      WHEN NOT MATCHED THEN
        INSERT (id,numero_corredor,nombre_completo,categoria,talla_tshirt,estado,fecha_inscripcion)
        VALUES (source.id,source.numero_corredor,source.nombre_completo,source.categoria,
                source.talla_tshirt,source.estado,source.fecha_inscripcion);`,
    params: (req) => {
      req.input('id',  sql.Int,          r.id);
      req.input('nc',  sql.Int,          r.numero_corredor ?? null);
      req.input('nom', sql.NVarChar(150), r.nombre_completo);
      req.input('cat', sql.NVarChar(10),  r.categoria);
      req.input('tal', sql.NVarChar(5),   r.talla_tshirt);
      req.input('est', sql.NVarChar(20),  r.estado);
      req.input('fi',  sql.DateTime2,     r.fecha_inscripcion ? new Date(r.fecha_inscripcion) : new Date());
    },
  }),

  pagos: (r) => ({
    query: `
      MERGE pagos AS target
      USING (VALUES (@id,@pid,@mo,@mp,@ep,@fp,@ob))
            AS source(id,participante_id,monto,metodo_pago,estado_pago,fecha_pago,observacion)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET participante_id=source.participante_id, monto=source.monto,
                   metodo_pago=source.metodo_pago, estado_pago=source.estado_pago,
                   fecha_pago=source.fecha_pago, observacion=source.observacion
      WHEN NOT MATCHED THEN
        INSERT (id,participante_id,monto,metodo_pago,estado_pago,fecha_pago,observacion)
        VALUES (source.id,source.participante_id,source.monto,source.metodo_pago,
                source.estado_pago,source.fecha_pago,source.observacion);`,
    params: (req) => {
      req.input('id',  sql.Int,           r.id);
      req.input('pid', sql.Int,           r.participante_id);
      req.input('mo',  sql.Decimal(10,2), r.monto ?? 0);
      req.input('mp',  sql.NVarChar(30),  r.metodo_pago ?? null);
      req.input('ep',  sql.NVarChar(20),  r.estado_pago);
      req.input('fp',  sql.DateTime2,     r.fecha_pago ? new Date(r.fecha_pago) : null);
      req.input('ob',  sql.NVarChar(500), r.observacion ?? null);
    },
  }),

  kits: (r) => ({
    query: `
      MERGE kits AS target
      USING (VALUES (@id,@pid,@ke,@fe,@ob))
            AS source(id,participante_id,kit_entregado,fecha_entrega,observacion)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET participante_id=source.participante_id, kit_entregado=source.kit_entregado,
                   fecha_entrega=source.fecha_entrega, observacion=source.observacion
      WHEN NOT MATCHED THEN
        INSERT (id,participante_id,kit_entregado,fecha_entrega,observacion)
        VALUES (source.id,source.participante_id,source.kit_entregado,
                source.fecha_entrega,source.observacion);`,
    params: (req) => {
      req.input('id',  sql.Int,          r.id);
      req.input('pid', sql.Int,          r.participante_id);
      req.input('ke',  sql.Bit,          r.kit_entregado ? 1 : 0);
      req.input('fe',  sql.DateTime2,    r.fecha_entrega ? new Date(r.fecha_entrega) : null);
      req.input('ob',  sql.NVarChar(500), r.observacion ?? null);
    },
  }),

  usuarios: (r) => ({
    query: `
      MERGE usuarios AS target
      USING (VALUES (@id,@un,@ph,@nc,@rol,@est,@fr,@tfs,@tfe))
            AS source(id,username,password_hash,nombre_completo,rol,estado,fecha_registro,two_factor_secret,two_factor_enabled)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET username=source.username, password_hash=source.password_hash,
                   nombre_completo=source.nombre_completo, rol=source.rol, estado=source.estado,
                   two_factor_secret=source.two_factor_secret, two_factor_enabled=source.two_factor_enabled
      WHEN NOT MATCHED THEN
        INSERT (id,username,password_hash,nombre_completo,rol,estado,fecha_registro,two_factor_secret,two_factor_enabled)
        VALUES (source.id,source.username,source.password_hash,source.nombre_completo,
                source.rol,source.estado,source.fecha_registro,source.two_factor_secret,source.two_factor_enabled);`,
    params: (req) => {
      req.input('id',  sql.Int,           r.id);
      req.input('un',  sql.NVarChar(50),  r.username);
      req.input('ph',  sql.NVarChar(sql.MAX), r.password_hash);
      req.input('nc',  sql.NVarChar(150), r.nombre_completo);
      req.input('rol', sql.NVarChar(30),  r.rol);
      req.input('est', sql.NVarChar(20),  r.estado);
      req.input('fr',  sql.DateTime2,     r.fecha_registro ? new Date(r.fecha_registro) : new Date());
      req.input('tfs', sql.NVarChar(sql.MAX), r.two_factor_secret ?? null);
      req.input('tfe', sql.Bit,           r.two_factor_enabled ? 1 : 0);
    },
  }),

  alumnos_vendedores: (r) => ({
    query: `
      MERGE alumnos_vendedores AS target
      USING (VALUES (@id,@nom,@ape,@tel,@ne,@tne,@gr,@jo,@mo,@fn,@cei,@ts,@uid,@est,@fr))
            AS source(id,nombre,apellidos,telefono_estudiante,nombre_encargado,telefono_encargado,
                      grado,jornada,modalidad,fecha_nacimiento,curso_extra_id,tipo_estudiante,
                      uid_tarjeta,estado,fecha_registro)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET nombre=source.nombre, apellidos=source.apellidos,
                   telefono_estudiante=source.telefono_estudiante,
                   nombre_encargado=source.nombre_encargado,
                   telefono_encargado=source.telefono_encargado,
                   grado=source.grado, jornada=source.jornada, modalidad=source.modalidad,
                   fecha_nacimiento=source.fecha_nacimiento, curso_extra_id=source.curso_extra_id,
                   tipo_estudiante=source.tipo_estudiante, uid_tarjeta=source.uid_tarjeta,
                   estado=source.estado
      WHEN NOT MATCHED THEN
        INSERT (id,nombre,apellidos,telefono_estudiante,nombre_encargado,telefono_encargado,
                grado,jornada,modalidad,fecha_nacimiento,curso_extra_id,tipo_estudiante,
                uid_tarjeta,estado,fecha_registro)
        VALUES (source.id,source.nombre,source.apellidos,source.telefono_estudiante,
                source.nombre_encargado,source.telefono_encargado,source.grado,source.jornada,
                source.modalidad,source.fecha_nacimiento,source.curso_extra_id,source.tipo_estudiante,
                source.uid_tarjeta,source.estado,source.fecha_registro);`,
    params: (req) => {
      req.input('id',  sql.UniqueIdentifier,    r.id);
      req.input('nom', sql.NVarChar(sql.MAX),   r.nombre);
      req.input('ape', sql.NVarChar(sql.MAX),   r.apellidos);
      req.input('tel', sql.VarChar(8),          r.telefono_estudiante ?? null);
      req.input('ne',  sql.NVarChar(sql.MAX),   r.nombre_encargado);
      req.input('tne', sql.NVarChar(sql.MAX),   r.telefono_encargado);
      req.input('gr',  sql.NVarChar(100),       r.grado);
      req.input('jo',  sql.NVarChar(100),       r.jornada);
      req.input('mo',  sql.NVarChar(100),       r.modalidad);
      req.input('fn',  sql.Date,                r.fecha_nacimiento ? new Date(r.fecha_nacimiento) : null);
      req.input('cei', sql.UniqueIdentifier,    r.curso_extra_id ?? null);
      req.input('ts',  sql.NVarChar(50),        r.tipo_estudiante ?? 'REGULAR');
      req.input('uid', sql.NVarChar(sql.MAX),   r.uid_tarjeta ?? null);
      req.input('est', sql.NVarChar(20),        r.estado ?? 'Activo');
      req.input('fr',  sql.DateTime2,           r.fecha_registro ? new Date(r.fecha_registro) : new Date());
    },
  }),

  boletos_preventa: (r) => ({
    query: `
      MERGE boletos_preventa AS target
      USING (VALUES (@id,@nb,@aid,@pid,@cat,@eb,@nc,@tal,@mo,@mp,@fa,@fc,@ob))
            AS source(id,numero_boleto,alumno_id,participante_id,categoria,estado_boleto,
                      nombre_comprador,talla_tshirt,monto,metodo_pago,fecha_asignacion,
                      fecha_confirmacion,observacion)
      ON target.id = source.id
      WHEN MATCHED THEN
        UPDATE SET alumno_id=source.alumno_id, participante_id=source.participante_id,
                   categoria=source.categoria, estado_boleto=source.estado_boleto,
                   nombre_comprador=source.nombre_comprador, talla_tshirt=source.talla_tshirt,
                   monto=source.monto, metodo_pago=source.metodo_pago,
                   fecha_confirmacion=source.fecha_confirmacion, observacion=source.observacion
      WHEN NOT MATCHED THEN
        INSERT (id,numero_boleto,alumno_id,participante_id,categoria,estado_boleto,
                nombre_comprador,talla_tshirt,monto,metodo_pago,fecha_asignacion,
                fecha_confirmacion,observacion)
        VALUES (source.id,source.numero_boleto,source.alumno_id,source.participante_id,
                source.categoria,source.estado_boleto,source.nombre_comprador,source.talla_tshirt,
                source.monto,source.metodo_pago,source.fecha_asignacion,
                source.fecha_confirmacion,source.observacion);`,
    params: (req) => {
      req.input('id',  sql.Int,              r.id);
      req.input('nb',  sql.Int,              r.numero_boleto ?? null);
      req.input('aid', sql.UniqueIdentifier, r.alumno_id);
      req.input('pid', sql.Int,              r.participante_id ?? null);
      req.input('cat', sql.NVarChar(10),     r.categoria ?? null);
      req.input('eb',  sql.NVarChar(20),     r.estado_boleto ?? 'Asignado');
      req.input('nc',  sql.NVarChar(150),    r.nombre_comprador ?? null);
      req.input('tal', sql.NVarChar(5),      r.talla_tshirt ?? null);
      req.input('mo',  sql.Decimal(10,2),    r.monto ? parseFloat(r.monto) : null);
      req.input('mp',  sql.NVarChar(30),     r.metodo_pago ?? null);
      req.input('fa',  sql.DateTime2,        r.fecha_asignacion ? new Date(r.fecha_asignacion) : new Date());
      req.input('fc',  sql.DateTime2,        r.fecha_confirmacion ? new Date(r.fecha_confirmacion) : null);
      req.input('ob',  sql.NVarChar(500),    r.observacion ?? null);
    },
  }),
};

const replicateUpsertSQLServer = async (table, row) => {
  const pool = await getSQLPool();
  if (!pool) return;
  const builder = sqlserverUpserts[table];
  if (!builder) return;
  const { query, params } = builder(row);
  const req = pool.request();
  params(req);
  await req.query(query);
};

const replicateDeleteSQLServer = async (table, id) => {
  const pool = await getSQLPool();
  if (!pool) return;
  const req = pool.request();
  const uuidTables = ['alumnos_vendedores'];
  if (uuidTables.includes(table)) {
    req.input('id', sql.UniqueIdentifier, id);
  } else {
    req.input('id', sql.Int, id);
  }
  await req.query(`DELETE FROM ${table} WHERE id = @id`);
};

// ─── MySQL ────────────────────────────────────────────────────────────────────

const mysqlUpserts = {
  participantes: (r) => [
    `INSERT INTO participantes (id,numero_corredor,nombre_completo,categoria,talla_tshirt,estado,fecha_inscripcion)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       numero_corredor=VALUES(numero_corredor), nombre_completo=VALUES(nombre_completo),
       categoria=VALUES(categoria), talla_tshirt=VALUES(talla_tshirt),
       estado=VALUES(estado), fecha_inscripcion=VALUES(fecha_inscripcion)`,
    [r.id, r.numero_corredor ?? null, r.nombre_completo, r.categoria, r.talla_tshirt,
     r.estado, r.fecha_inscripcion ? new Date(r.fecha_inscripcion) : new Date()],
  ],

  pagos: (r) => [
    `INSERT INTO pagos (id,participante_id,monto,metodo_pago,estado_pago,fecha_pago,observacion)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       participante_id=VALUES(participante_id), monto=VALUES(monto),
       metodo_pago=VALUES(metodo_pago), estado_pago=VALUES(estado_pago),
       fecha_pago=VALUES(fecha_pago), observacion=VALUES(observacion)`,
    [r.id, r.participante_id, r.monto ?? 0, r.metodo_pago ?? null, r.estado_pago,
     r.fecha_pago ? new Date(r.fecha_pago) : null, r.observacion ?? null],
  ],

  kits: (r) => [
    `INSERT INTO kits (id,participante_id,kit_entregado,fecha_entrega,observacion)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       participante_id=VALUES(participante_id), kit_entregado=VALUES(kit_entregado),
       fecha_entrega=VALUES(fecha_entrega), observacion=VALUES(observacion)`,
    [r.id, r.participante_id, r.kit_entregado ? 1 : 0,
     r.fecha_entrega ? new Date(r.fecha_entrega) : null, r.observacion ?? null],
  ],

  usuarios: (r) => [
    `INSERT INTO usuarios (id,username,password_hash,nombre_completo,rol,estado,fecha_registro,two_factor_secret,two_factor_enabled)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       username=VALUES(username), password_hash=VALUES(password_hash),
       nombre_completo=VALUES(nombre_completo), rol=VALUES(rol), estado=VALUES(estado),
       two_factor_secret=VALUES(two_factor_secret), two_factor_enabled=VALUES(two_factor_enabled)`,
    [r.id, r.username, r.password_hash, r.nombre_completo, r.rol, r.estado,
     r.fecha_registro ? new Date(r.fecha_registro) : new Date(),
     r.two_factor_secret ?? null, r.two_factor_enabled ? 1 : 0],
  ],

  alumnos_vendedores: (r) => [
    `INSERT INTO alumnos_vendedores
       (id,nombre,apellidos,telefono_estudiante,nombre_encargado,telefono_encargado,
        grado,jornada,modalidad,fecha_nacimiento,curso_extra_id,tipo_estudiante,
        uid_tarjeta,estado,fecha_registro)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       nombre=VALUES(nombre), apellidos=VALUES(apellidos),
       telefono_estudiante=VALUES(telefono_estudiante),
       nombre_encargado=VALUES(nombre_encargado),
       telefono_encargado=VALUES(telefono_encargado),
       grado=VALUES(grado), jornada=VALUES(jornada), modalidad=VALUES(modalidad),
       fecha_nacimiento=VALUES(fecha_nacimiento), curso_extra_id=VALUES(curso_extra_id),
       tipo_estudiante=VALUES(tipo_estudiante), uid_tarjeta=VALUES(uid_tarjeta),
       estado=VALUES(estado)`,
    [
      r.id,
      r.nombre,
      r.apellidos,
      r.telefono_estudiante ?? null,
      r.nombre_encargado,
      r.telefono_encargado,
      r.grado,
      r.jornada,
      r.modalidad,
      r.fecha_nacimiento ? new Date(r.fecha_nacimiento) : null,
      r.curso_extra_id ?? null,
      r.tipo_estudiante ?? 'REGULAR',
      r.uid_tarjeta ?? null,
      r.estado ?? 'Activo',
      r.fecha_registro ? new Date(r.fecha_registro) : new Date(),
    ],
  ],

  boletos_preventa: (r) => [
    `INSERT INTO boletos_preventa
       (id,numero_boleto,alumno_id,participante_id,categoria,estado_boleto,
        nombre_comprador,talla_tshirt,monto,metodo_pago,fecha_asignacion,
        fecha_confirmacion,observacion)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       alumno_id=VALUES(alumno_id), participante_id=VALUES(participante_id),
       categoria=VALUES(categoria), estado_boleto=VALUES(estado_boleto),
       nombre_comprador=VALUES(nombre_comprador), talla_tshirt=VALUES(talla_tshirt),
       monto=VALUES(monto), metodo_pago=VALUES(metodo_pago),
       fecha_confirmacion=VALUES(fecha_confirmacion), observacion=VALUES(observacion)`,
    [
      r.id,
      r.numero_boleto ?? null,
      r.alumno_id,
      r.participante_id ?? null,
      r.categoria ?? null,
      r.estado_boleto ?? 'Asignado',
      r.nombre_comprador ?? null,
      r.talla_tshirt ?? null,
      r.monto ? parseFloat(r.monto) : null,
      r.metodo_pago ?? null,
      r.fecha_asignacion ? new Date(r.fecha_asignacion) : new Date(),
      r.fecha_confirmacion ? new Date(r.fecha_confirmacion) : null,
      r.observacion ?? null,
    ],
  ],
};

const replicateUpsertMySQL = async (table, row) => {
  const pool = await getMySQLPool();
  if (!pool) return;
  const builder = mysqlUpserts[table];
  if (!builder) return;
  const [query, params] = builder(row);
  // Usar conexión explícita para deshabilitar FK checks por sesión
  // (MySQL es réplica: el orden de replicación puede no coincidir con el orden de FK)
  const conn = await pool.getConnection();
  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute(query, params);
  } finally {
    await conn.execute('SET FOREIGN_KEY_CHECKS=1').catch(() => {});
    conn.release();
  }
};

const replicateDeleteMySQL = async (table, id) => {
  const pool = await getMySQLPool();
  if (!pool) return;
  await pool.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
};

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Replica un INSERT o UPDATE a SQL Server y MySQL.
 * No lanza excepción — los errores se loguean en consola.
 */
const replicateUpsert = (table, row) => {
  Promise.allSettled([
    replicateUpsertSQLServer(table, row),
    replicateUpsertMySQL(table, row),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const db = i === 0 ? 'SQLServer' : 'MySQL';
        console.error(`[Replicación][${db}][${table}] upsert id=${row.id}: ${r.reason?.message}`);
      }
    });
  });
};

/**
 * Replica un DELETE a SQL Server y MySQL.
 * No lanza excepción.
 */
const replicateDelete = (table, id) => {
  Promise.allSettled([
    replicateDeleteSQLServer(table, id),
    replicateDeleteMySQL(table, id),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const db = i === 0 ? 'SQLServer' : 'MySQL';
        console.error(`[Replicación][${db}][${table}] delete id=${id}: ${r.reason?.message}`);
      }
    });
  });
};

module.exports = { replicateUpsert, replicateDelete };
