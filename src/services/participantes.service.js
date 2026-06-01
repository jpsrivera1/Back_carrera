const supabase = require('../config/db');
const { replicateUpsert } = require('./replication.service');

const CATEGORIAS_VALIDAS = ['5K', '10K'];
const TALLAS_VALIDAS = ['4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ESTADOS_VALIDOS = ['Activo', 'Cancelado'];

const getAll = async () => {
  const { data, error } = await supabase
    .from('participantes')
    .select('*')
    .order('numero_corredor', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

const getById = async (id) => {
  const { data, error } = await supabase
    .from('participantes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
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

const create = async ({ nombre_completo, categoria, talla_tshirt }) => {
  if (!nombre_completo || nombre_completo.trim() === '') {
    const err = new Error('El nombre_completo es obligatorio');
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

  // Verificar límite de 200 cupos (solo registro directo)
  const { count, error: countErr } = await supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Activo');
  if (countErr) throw new Error(countErr.message);
  if (count >= 200) {
    const err = new Error('No hay cupos disponibles. El límite máximo general es de 200 cupos');
    err.status = 400;
    throw err;
  }

  // Asignar numero_corredor en Node.js (sin depender de trigger)
  const numero_corredor = await _nextNumeroCorredor();

  const { data, error } = await supabase
    .from('participantes')
    .insert({ nombre_completo: nombre_completo.trim(), categoria, talla_tshirt, numero_corredor, estado: 'Activo' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  replicateUpsert('participantes', data);

  // Crear pago pendiente y kit (antes lo hacía el trigger trigger_crear_pago_y_kit)
  await supabase.from('pagos').insert({ participante_id: data.id, estado_pago: 'Pendiente' });
  await supabase.from('kits').insert({ participante_id: data.id, kit_entregado: false });

  return data;
};

const update = async (id, { nombre_completo, categoria, talla_tshirt, estado }) => {
  if (nombre_completo !== undefined && nombre_completo.trim() === '') {
    const err = new Error('El nombre_completo no puede estar vacío');
    err.status = 400;
    throw err;
  }
  if (categoria !== undefined && !CATEGORIAS_VALIDAS.includes(categoria)) {
    const err = new Error(`La categoría debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (talla_tshirt !== undefined && !TALLAS_VALIDAS.includes(talla_tshirt)) {
    const err = new Error(`La talla_tshirt debe ser una de: ${TALLAS_VALIDAS.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    const err = new Error(`El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const current = await getById(id);
  if (!current) {
    const err = new Error('Participante no encontrado');
    err.status = 404;
    throw err;
  }

  const fields = {
    nombre_completo: nombre_completo !== undefined ? nombre_completo.trim() : current.nombre_completo,
    categoria: categoria !== undefined ? categoria : current.categoria,
    talla_tshirt: talla_tshirt !== undefined ? talla_tshirt : current.talla_tshirt,
    estado: estado !== undefined ? estado : current.estado,
  };

  const { data, error } = await supabase
    .from('participantes')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  replicateUpsert('participantes', data);
  return data;
};

const cancelar = async (id) => {
  const current = await getById(id);
  if (!current) {
    const err = new Error('Participante no encontrado');
    err.status = 404;
    throw err;
  }

  // Eliminar kits y pagos asociados
  await supabase.from('kits').delete().eq('participante_id', id);
  await supabase.from('pagos').delete().eq('participante_id', id);

  // Si tiene boleto preventa vinculado, desvincularlo
  await supabase
    .from('boletos_preventa')
    .update({ participante_id: null, estado_boleto: 'Disponible' })
    .eq('participante_id', id);

  // Eliminar el participante completamente
  const { error } = await supabase
    .from('participantes')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);

  return { id, deleted: true };
};

const buscar = async (termino) => {
  const { data, error } = await supabase
    .from('participantes')
    .select('*')
    .ilike('nombre_completo', `%${termino}%`)
    .order('numero_corredor', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

module.exports = { getAll, getById, create, update, cancelar, buscar };
