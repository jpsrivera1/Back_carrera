const supabase = require('../config/db');

const ESTADOS_BOLETO     = ['Asignado', 'Vendido', 'No vendido', 'Anulado'];
const CATEGORIAS_VALIDAS = ['5K', '10K'];
const TALLAS_VALIDAS     = ['4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const METODOS_VALIDOS    = ['Efectivo', 'Transferencia'];
const ESTADOS_ALUMNO     = ['Activo', 'Inactivo'];

// ─────────────────────────────────────────
// ALUMNOS VENDEDORES
// ─────────────────────────────────────────

const getAllAlumnos = async () => {
  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .select('*')
    .order('nombre', { ascending: true })
    .order('apellidos', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const getAlumnoById = async (id) => {
  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const createAlumno = async ({
  nombre, apellidos, grado, jornada, modalidad,
  telefono_estudiante, nombre_encargado, telefono_encargado,
  fecha_nacimiento, tipo_estudiante, uid_tarjeta,
}) => {
  if (!nombre || nombre.trim() === '') {
    const err = new Error('El nombre es obligatorio');
    err.status = 400;
    throw err;
  }
  if (!apellidos || apellidos.trim() === '') {
    const err = new Error('Los apellidos son obligatorios');
    err.status = 400;
    throw err;
  }
  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .insert({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      grado,
      jornada,
      modalidad,
      telefono_estudiante: telefono_estudiante || null,
      nombre_encargado,
      telefono_encargado,
      fecha_nacimiento,
      tipo_estudiante: tipo_estudiante || 'REGULAR',
      uid_tarjeta: uid_tarjeta || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const updateAlumno = async (id, {
  nombre, apellidos, grado, jornada, modalidad,
  telefono_estudiante, nombre_encargado, telefono_encargado,
  fecha_nacimiento, tipo_estudiante, uid_tarjeta, estado,
}) => {
  if (nombre !== undefined && nombre.trim() === '') {
    const err = new Error('El nombre no puede estar vacío');
    err.status = 400;
    throw err;
  }
  if (estado !== undefined && !ESTADOS_ALUMNO.includes(estado)) {
    const err = new Error(`El estado debe ser uno de: ${ESTADOS_ALUMNO.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const current = await getAlumnoById(id);
  if (!current) {
    const err = new Error('Alumno vendedor no encontrado');
    err.status = 404;
    throw err;
  }

  const fields = {};
  if (nombre              !== undefined) fields.nombre              = nombre.trim();
  if (apellidos           !== undefined) fields.apellidos           = apellidos.trim();
  if (grado               !== undefined) fields.grado               = grado;
  if (jornada             !== undefined) fields.jornada             = jornada;
  if (modalidad           !== undefined) fields.modalidad           = modalidad;
  if (telefono_estudiante !== undefined) fields.telefono_estudiante = telefono_estudiante;
  if (nombre_encargado    !== undefined) fields.nombre_encargado    = nombre_encargado;
  if (telefono_encargado  !== undefined) fields.telefono_encargado  = telefono_encargado;
  if (fecha_nacimiento    !== undefined) fields.fecha_nacimiento    = fecha_nacimiento;
  if (tipo_estudiante     !== undefined) fields.tipo_estudiante     = tipo_estudiante;
  if (uid_tarjeta         !== undefined) fields.uid_tarjeta         = uid_tarjeta;
  if (estado              !== undefined) fields.estado              = estado;

  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const desactivarAlumno = async (id) => {
  const current = await getAlumnoById(id);
  if (!current) {
    const err = new Error('Alumno vendedor no encontrado');
    err.status = 404;
    throw err;
  }
  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .update({ estado: 'Inactivo' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const buscarAlumnos = async (termino) => {
  const t = termino.trim();
  const { data, error } = await supabase
    .from('alumnos_vendedores')
    .select('*')
    .or(`nombre.ilike.%${t}%,apellidos.ilike.%${t}%,grado.ilike.%${t}%,uid_tarjeta.ilike.%${t}%`)
    .order('nombre', { ascending: true })
    .order('apellidos', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

// ─────────────────────────────────────────
// BOLETOS DE PREVENTA
// ─────────────────────────────────────────

const getAllBoletos = async () => {
  const { data, error } = await supabase
    .from('vista_preventa_boletos')
    .select('*')
    .order('numero_boleto', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const getBoletoById = async (id) => {
  const { data, error } = await supabase
    .from('vista_preventa_boletos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const asignarBoleto = async ({ alumno_id }) => {
  if (!alumno_id) {
    const err = new Error('alumno_id es obligatorio');
    err.status = 400;
    throw err;
  }

  // La categoría se define al momento de la venta, no al asignar
  const { data, error } = await supabase
    .from('boletos_preventa')
    .insert({ alumno_id, categoria: null, participante_id: null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const asignarMultiple = async ({ alumno_id, cantidad }) => {
  if (!alumno_id) {
    const err = new Error('alumno_id es obligatorio');
    err.status = 400;
    throw err;
  }
  const qty = parseInt(cantidad);
  if (!qty || qty < 1) {
    const err = new Error('La cantidad debe ser mayor a 0');
    err.status = 400;
    throw err;
  }

  // La categoría se define al momento de la venta, no al asignar
  const boletoRows = Array.from({ length: qty }, () => ({
    alumno_id,
    categoria: null,
    participante_id: null,
  }));
  const { data, error } = await supabase
    .from('boletos_preventa')
    .insert(boletoRows)
    .select();
  if (error) throw new Error(error.message);
  return data;
};

// Función auxiliar: calcula el siguiente numero_corredor
const _nextNumeroCorredor = async () => {
  const { data, error } = await supabase
    .from('participantes')
    .select('numero_corredor')
    .order('numero_corredor', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.numero_corredor || 0) + 1;
};

const _getBoletoRaw = async (id) => {
  const { data, error } = await supabase
    .from('boletos_preventa')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const marcarVendido = async (id, { nombre_comprador, categoria, talla_tshirt, monto, metodo_pago, observacion }) => {
  if (!nombre_comprador || nombre_comprador.trim() === '') {
    const err = new Error('El nombre_comprador es obligatorio');
    err.status = 400;
    throw err;
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    const err = new Error(`La categoría debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (!TALLAS_VALIDAS.includes(talla_tshirt)) {
    const err = new Error(`La talla_tshirt debe ser una de: ${TALLAS_VALIDAS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (!monto || parseFloat(monto) <= 0) {
    const err = new Error('El monto debe ser mayor a 0');
    err.status = 400;
    throw err;
  }
  if (!METODOS_VALIDOS.includes(metodo_pago)) {
    const err = new Error(`El metodo_pago debe ser uno de: ${METODOS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const current = await _getBoletoRaw(id);
  if (!current) {
    const err = new Error('Boleto no encontrado');
    err.status = 404;
    throw err;
  }
  if (current.estado_boleto === 'Anulado') {
    const err = new Error('No se puede vender un boleto Anulado');
    err.status = 400;
    throw err;
  }
  if (current.estado_boleto === 'Vendido') {
    const err = new Error('Este boleto ya fue marcado como vendido');
    err.status = 400;
    throw err;
  }

  // 1. Reutilizar participante existente del boleto (si un intento previo lo creó)
  //    o crear uno nuevo. Esto evita duplicados si la solicitud se repite.
  let participanteId = current.participante_id || null;

  if (participanteId) {
    // Ya existe un participante vinculado — solo actualizar sus datos
    const { error: pErr } = await supabase
      .from('participantes')
      .update({
        nombre_completo: nombre_comprador.trim(),
        categoria,
        talla_tshirt,
        estado: 'Activo',
      })
      .eq('id', participanteId);
    if (pErr) throw new Error(pErr.message);
  } else {
    // Verificar límite de 200 cupos antes de crear participante desde preventa
    const { count: cuposActivos, error: cuposErr } = await supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'Activo');
    if (cuposErr) throw new Error(cuposErr.message);
    if (cuposActivos >= 200) {
      const err = new Error('No hay cupos disponibles. El límite máximo general es de 200 cupos');
      err.status = 400;
      throw err;
    }

    // Crear participante nuevo — asignar numero_corredor en Node.js (sin trigger)
    const numero_corredor = await _nextNumeroCorredor();
    const { data: participante, error: pErr } = await supabase
      .from('participantes')
      .insert({
        nombre_completo: nombre_comprador.trim(),
        categoria,
        talla_tshirt,
        estado: 'Activo',
        numero_corredor,
      })
      .select()
      .single();
    if (pErr) throw new Error(pErr.message);
    participanteId = participante.id;
  }

  // 2. Actualizar boleto marcándolo como Vendido
  const { data, error } = await supabase
    .from('boletos_preventa')
    .update({
      estado_boleto:      'Vendido',
      categoria,
      participante_id:    participanteId,
      nombre_comprador:   nombre_comprador.trim(),
      talla_tshirt,
      monto:              parseFloat(monto),
      metodo_pago,
      observacion:        observacion || null,
      fecha_confirmacion: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // 3. Registrar/actualizar pago vinculado al participante
  const { error: pagoErr } = await supabase
    .from('pagos')
    .upsert(
      {
        participante_id: participanteId,
        monto:           parseFloat(monto),
        metodo_pago,
        estado_pago:     'Pagado',
        fecha_pago:      new Date().toISOString(),
        observacion:     observacion || null,
      },
      { onConflict: 'participante_id' }
    );
  if (pagoErr) throw new Error(pagoErr.message);

  // 4. Registrar/actualizar kit vinculado al participante
  const { error: kitErr } = await supabase
    .from('kits')
    .upsert(
      { participante_id: participanteId, kit_entregado: false },
      { onConflict: 'participante_id' }
    );
  if (kitErr) throw new Error(kitErr.message);

  return data;
};

const marcarNoVendido = async (id, { observacion }) => {
  const current = await _getBoletoRaw(id);
  if (!current) {
    const err = new Error('Boleto no encontrado');
    err.status = 404;
    throw err;
  }
  if (current.estado_boleto === 'Vendido') {
    const err = new Error('No se puede marcar como No vendido: el boleto ya está confirmado como vendido');
    err.status = 400;
    throw err;
  }
  if (current.estado_boleto === 'Anulado') {
    const err = new Error('No se puede cambiar el estado de un boleto Anulado');
    err.status = 400;
    throw err;
  }

  // El participante reservado queda en estado 'Pendiente' (número de corredor ocupado pero sin pagar)
  // Solo actualizamos el estado del boleto
  const { data, error } = await supabase
    .from('boletos_preventa')
    .update({ estado_boleto: 'No vendido', observacion: observacion || null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const anularBoleto = async (id, { observacion }) => {
  const current = await _getBoletoRaw(id);
  if (!current) {
    const err = new Error('Boleto no encontrado');
    err.status = 404;
    throw err;
  }
  if (current.estado_boleto === 'Vendido') {
    const err = new Error('No se puede anular un boleto ya confirmado como vendido');
    err.status = 400;
    throw err;
  }

  // Eliminar completamente al participante vinculado (si existe) para no dejar registros huérfanos
  if (current.participante_id) {
    await supabase.from('kits').delete().eq('participante_id', current.participante_id);
    await supabase.from('pagos').delete().eq('participante_id', current.participante_id);
    const { error: pErr } = await supabase
      .from('participantes')
      .delete()
      .eq('id', current.participante_id);
    if (pErr) throw new Error(pErr.message);
  }

  const { data, error } = await supabase
    .from('boletos_preventa')
    .update({
      estado_boleto:   'Anulado',
      participante_id: null,
      observacion:     observacion || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ─────────────────────────────────────────
// CONSULTAS Y RESÚMENES
// ─────────────────────────────────────────

const getResumenAlumnos = async () => {
  const { data, error } = await supabase
    .from('vista_resumen_preventa_alumnos')
    .select('*');
  if (error) throw new Error(error.message);
  return data;
};

const getDashboardGeneral = async () => {
  const { data, error } = await supabase
    .from('vista_dashboard_general')
    .select('*');
  if (error) throw new Error(error.message);
  return data;
};

const getBoletosByEstado = async (estado) => {
  const estadoDecoded = decodeURIComponent(estado);
  if (!ESTADOS_BOLETO.includes(estadoDecoded)) {
    const err = new Error(`Estado inválido. Use: ${ESTADOS_BOLETO.join(', ')}`);
    err.status = 400;
    throw err;
  }
  const { data, error } = await supabase
    .from('vista_preventa_boletos')
    .select('*')
    .eq('estado_boleto', estadoDecoded)
    .order('numero_boleto', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const getBoletosByAlumno = async (alumno_id) => {
  const { data, error } = await supabase
    .from('vista_preventa_boletos')
    .select('*')
    .eq('alumno_id', alumno_id)
    .order('numero_boleto', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const buscarBoletos = async (termino) => {
  const t = termino.trim();

  // 1. Buscar boletos por campos propios del boleto
  const { data: byBoleto, error: e1 } = await supabase
    .from('vista_preventa_boletos')
    .select('*')
    .or(`nombre_comprador.ilike.%${t}%,categoria.ilike.%${t}%,estado_boleto.ilike.%${t}%`)
    .order('numero_boleto', { ascending: true });
  if (e1) throw new Error(e1.message);

  // 2. Buscar alumnos por nombre/apellidos y traer sus boletos
  const { data: alumnos, error: e2 } = await supabase
    .from('alumnos_vendedores')
    .select('id')
    .or(`nombre.ilike.%${t}%,apellidos.ilike.%${t}%`);
  if (e2) throw new Error(e2.message);

  let byAlumno = [];
  if (alumnos && alumnos.length > 0) {
    const alumnoIds = alumnos.map((a) => a.id);
    const { data: boletosAlumno, error: e3 } = await supabase
      .from('vista_preventa_boletos')
      .select('*')
      .in('alumno_id', alumnoIds)
      .order('numero_boleto', { ascending: true });
    if (e3) throw new Error(e3.message);
    byAlumno = boletosAlumno || [];
  }

  // 3. Combinar y deduplicar
  const merged = [...(byBoleto || [])];
  const ids = new Set(merged.map((b) => b.id));
  byAlumno.forEach((b) => { if (!ids.has(b.id)) merged.push(b); });

  // 4. Si el término es numérico, buscar también por numero_boleto
  const num = parseInt(t);
  if (!isNaN(num)) {
    const { data: byNumero } = await supabase
      .from('vista_preventa_boletos')
      .select('*')
      .eq('numero_boleto', num);
    (byNumero || []).forEach((b) => { if (!ids.has(b.id)) merged.push(b); });
  }

  return merged.sort((a, b) => (a.numero_boleto || 0) - (b.numero_boleto || 0));
};

module.exports = {
  getAllAlumnos, getAlumnoById, createAlumno, updateAlumno, desactivarAlumno,
  buscarAlumnos,
  getAllBoletos, getBoletoById, asignarBoleto, asignarMultiple,
  marcarVendido, marcarNoVendido, anularBoleto,
  getResumenAlumnos, getDashboardGeneral,
  getBoletosByEstado, getBoletosByAlumno, buscarBoletos,
};
