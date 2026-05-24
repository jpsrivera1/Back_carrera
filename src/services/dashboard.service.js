const supabase = require('../config/db');

const CUPOS_TOTALES = 200;

const getResumen = async () => {
  const [
    { data: participantes, error: e1 },
    { data: pagos, error: e2 },
    { data: kits, error: e3 },
  ] = await Promise.all([
    supabase.from('participantes').select('id, categoria, estado'),
    supabase.from('pagos').select('estado_pago, monto'),
    supabase.from('kits').select('kit_entregado'),
  ]);

  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  if (e3) throw new Error(e3.message);

  const activos = participantes.filter((p) => p.estado === 'Activo');
  const total_inscritos = activos.length;
  const inscritos_5k = activos.filter((p) => p.categoria === '5K').length;
  const inscritos_10k = activos.filter((p) => p.categoria === '10K').length;

  const pagos_realizados = pagos.filter((p) => p.estado_pago === 'Pagado').length;
  const pagos_pendientes = pagos.filter((p) => p.estado_pago === 'Pendiente').length;
  const total_recaudado = pagos
    .filter((p) => p.estado_pago === 'Pagado')
    .reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

  const kits_entregados = kits.filter((k) => k.kit_entregado === true).length;
  const kits_pendientes = kits.filter((k) => k.kit_entregado === false).length;

  return [{
    cupos_totales: CUPOS_TOTALES,
    total_inscritos,
    inscritos_5k,
    inscritos_10k,
    pagos_realizados,
    pagos_pendientes,
    total_recaudado,
    kits_entregados,
    kits_pendientes,
  }];
};

const getTallas = async () => {
  const { data, error } = await supabase
    .from('participantes')
    .select('talla_tshirt')
    .eq('estado', 'Activo');
  if (error) throw new Error(error.message);

  const counts = {};
  for (const row of data) {
    counts[row.talla_tshirt] = (counts[row.talla_tshirt] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([talla_tshirt, total]) => ({ talla_tshirt, total }))
    .sort((a, b) => a.talla_tshirt.localeCompare(b.talla_tshirt));
};

const getCategorias = async () => {
  const { data, error } = await supabase
    .from('participantes')
    .select('categoria')
    .eq('estado', 'Activo');
  if (error) throw new Error(error.message);

  const counts = {};
  for (const row of data) {
    counts[row.categoria] = (counts[row.categoria] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
};

module.exports = { getResumen, getTallas, getCategorias };
