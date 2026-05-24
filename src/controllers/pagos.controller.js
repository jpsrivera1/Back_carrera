const service = require('../services/pagos.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, message: 'Pagos obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getPendientes = async (req, res, next) => {
  try {
    const data = await service.getPendientes();
    res.json({ success: true, message: 'Pagos pendientes obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getPagados = async (req, res, next) => {
  try {
    const data = await service.getPagados();
    res.json({ success: true, message: 'Pagos completados obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const updatePago = async (req, res, next) => {
  try {
    const { participante_id } = req.params;
    const { monto, metodo_pago, estado_pago, observacion } = req.body;
    const data = await service.updatePago(participante_id, { monto, metodo_pago, estado_pago, observacion });
    res.json({ success: true, message: 'Pago actualizado correctamente', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getPendientes, getPagados, updatePago };
