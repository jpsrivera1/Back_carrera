const supabase = require('../config/db');
const { replicateUpsert } = require('./replication.service');

const METODOS_VALIDOS = ['Efectivo', 'Transferencia'];
const ESTADOS_PAGO_VALIDOS = ['Pendiente', 'Pagado', 'Anulado'];

const _formatPagos = (rows) =>
  rows.map((p) => ({
    id: p.id,
    participante_id: p.participante_id,
    monto: p.monto,
    metodo_pago: p.metodo_pago,
    estado_pago: p.estado_pago,
    fecha_pago: p.fecha_pago,
    observacion: p.observacion,
    numero_corredor: p.participantes?.numero_corredor,
    nombre_completo: p.participantes?.nombre_completo,
    categoria: p.participantes?.categoria,
  }));

const getAll = async () => {
  const { data, error } = await supabase
    .from('pagos')
    .select('id, participante_id, monto, metodo_pago, estado_pago, fecha_pago, observacion, participantes(numero_corredor, nombre_completo, categoria)')
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatPagos(data);
};

const getPendientes = async () => {
  const { data, error } = await supabase
    .from('pagos')
    .select('id, participante_id, monto, metodo_pago, estado_pago, fecha_pago, observacion, participantes(numero_corredor, nombre_completo, categoria)')
    .eq('estado_pago', 'Pendiente')
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatPagos(data);
};

const getPagados = async () => {
  const { data, error } = await supabase
    .from('pagos')
    .select('id, participante_id, monto, metodo_pago, estado_pago, fecha_pago, observacion, participantes(numero_corredor, nombre_completo, categoria)')
    .eq('estado_pago', 'Pagado')
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatPagos(data);
};

const updatePago = async (participante_id, { monto, metodo_pago, estado_pago, observacion }) => {
  if (metodo_pago !== undefined && !METODOS_VALIDOS.includes(metodo_pago)) {
    const err = new Error(`El metodo_pago debe ser uno de: ${METODOS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (estado_pago !== undefined && !ESTADOS_PAGO_VALIDOS.includes(estado_pago)) {
    const err = new Error(`El estado_pago debe ser uno de: ${ESTADOS_PAGO_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('pagos')
    .select('*')
    .eq('participante_id', participante_id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) {
    const err = new Error('No se encontró un registro de pago para este participante');
    err.status = 404;
    throw err;
  }

  const updateFields = {
    monto: monto !== undefined ? monto : existing.monto,
    metodo_pago: metodo_pago !== undefined ? metodo_pago : existing.metodo_pago,
    estado_pago: estado_pago !== undefined ? estado_pago : existing.estado_pago,
    observacion: observacion !== undefined ? observacion : existing.observacion,
    fecha_pago: estado_pago === 'Pagado' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('pagos')
    .update(updateFields)
    .eq('participante_id', participante_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  replicateUpsert('pagos', data);
  return data;
};

module.exports = { getAll, getPendientes, getPagados, updatePago };
