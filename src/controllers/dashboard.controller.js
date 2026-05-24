const service = require('../services/dashboard.service');

const getResumen = async (req, res, next) => {
  try {
    const data = await service.getResumen();
    res.json({ success: true, message: 'Resumen del dashboard obtenido correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getTallas = async (req, res, next) => {
  try {
    const data = await service.getTallas();
    res.json({ success: true, message: 'Resumen por tallas obtenido correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getCategorias = async (req, res, next) => {
  try {
    const data = await service.getCategorias();
    res.json({ success: true, message: 'Resumen por categorías obtenido correctamente', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getResumen, getTallas, getCategorias };
