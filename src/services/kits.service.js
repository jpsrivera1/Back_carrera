const supabase = require('../config/db');

const _formatKits = (rows) =>
  rows.map((k) => ({
    id: k.id,
    participante_id: k.participante_id,
    kit_entregado: k.kit_entregado,
    fecha_entrega: k.fecha_entrega,
    observacion: k.observacion,
    numero_corredor: k.participantes?.numero_corredor,
    nombre_completo: k.participantes?.nombre_completo,
    categoria: k.participantes?.categoria,
    talla_tshirt: k.participantes?.talla_tshirt,
  }));

const getAll = async () => {
  const { data, error } = await supabase
    .from('kits')
    .select('id, participante_id, kit_entregado, fecha_entrega, observacion, participantes(numero_corredor, nombre_completo, categoria, talla_tshirt)')
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatKits(data);
};

const getPendientes = async () => {
  const { data, error } = await supabase
    .from('kits')
    .select('id, participante_id, kit_entregado, fecha_entrega, observacion, participantes(numero_corredor, nombre_completo, categoria, talla_tshirt)')
    .eq('kit_entregado', false)
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatKits(data);
};

const getEntregados = async () => {
  const { data, error } = await supabase
    .from('kits')
    .select('id, participante_id, kit_entregado, fecha_entrega, observacion, participantes(numero_corredor, nombre_completo, categoria, talla_tshirt)')
    .eq('kit_entregado', true)
    .order('participante_id', { ascending: true });
  if (error) throw new Error(error.message);
  return _formatKits(data);
};

const entregar = async (participante_id, { observacion }) => {
  const { data: existing, error: fetchErr } = await supabase
    .from('kits')
    .select('id')
    .eq('participante_id', participante_id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) {
    const err = new Error('No se encontró un registro de kit para este participante');
    err.status = 404;
    throw err;
  }

  const { data, error } = await supabase
    .from('kits')
    .update({ kit_entregado: true, fecha_entrega: new Date().toISOString(), observacion: observacion || null })
    .eq('participante_id', participante_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const revertir = async (participante_id) => {
  const { data: existing, error: fetchErr } = await supabase
    .from('kits')
    .select('id')
    .eq('participante_id', participante_id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) {
    const err = new Error('No se encontró un registro de kit para este participante');
    err.status = 404;
    throw err;
  }

  const { data, error } = await supabase
    .from('kits')
    .update({ kit_entregado: false, fecha_entrega: null })
    .eq('participante_id', participante_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

module.exports = { getAll, getPendientes, getEntregados, entregar, revertir };
