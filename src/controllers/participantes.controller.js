const service = require('../services/participantes.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, message: 'Participantes obtenidos correctamente', data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await service.getById(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Participante no encontrado' });
    }
    res.json({ success: true, message: 'Participante obtenido correctamente', data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre_completo, categoria, talla_tshirt } = req.body;
    const data = await service.create({ nombre_completo, categoria, talla_tshirt });
    res.status(201).json({ success: true, message: 'Participante registrado correctamente', data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_completo, categoria, talla_tshirt, estado } = req.body;
    const data = await service.update(id, { nombre_completo, categoria, talla_tshirt, estado });
    res.json({ success: true, message: 'Participante actualizado correctamente', data });
  } catch (err) {
    next(err);
  }
};

const cancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await service.cancelar(id);
    res.json({ success: true, message: 'Participante cancelado correctamente', data });
  } catch (err) {
    next(err);
  }
};

const buscar = async (req, res, next) => {
  try {
    const { termino } = req.params;
    const data = await service.buscar(termino);
    res.json({ success: true, message: 'Búsqueda realizada correctamente', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, cancelar, buscar };
