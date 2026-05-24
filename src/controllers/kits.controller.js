const service = require('../services/kits.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, message: 'Kits obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getPendientes = async (req, res, next) => {
  try {
    const data = await service.getPendientes();
    res.json({ success: true, message: 'Kits pendientes obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getEntregados = async (req, res, next) => {
  try {
    const data = await service.getEntregados();
    res.json({ success: true, message: 'Kits entregados obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const entregar = async (req, res, next) => {
  try {
    const { participante_id } = req.params;
    const { observacion } = req.body;
    const data = await service.entregar(participante_id, { observacion });
    res.json({ success: true, message: 'Kit marcado como entregado correctamente', data });
  } catch (err) {
    next(err);
  }
};

const revertir = async (req, res, next) => {
  try {
    const { participante_id } = req.params;
    const data = await service.revertir(participante_id);
    res.json({ success: true, message: 'Entrega de kit revertida correctamente', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getPendientes, getEntregados, entregar, revertir };
