const service = require('../services/preventa.service');

// ─────────────────────────────────────────
// ALUMNOS VENDEDORES
// ─────────────────────────────────────────

const getAllAlumnos = async (req, res, next) => {
  try {
    const data = await service.getAllAlumnos();
    res.json({ success: true, message: 'Alumnos vendedores obtenidos correctamente', data });
  } catch (err) { next(err); }
};

const getAlumnoById = async (req, res, next) => {
  try {
    const data = await service.getAlumnoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Alumno vendedor no encontrado' });
    res.json({ success: true, message: 'Alumno vendedor obtenido correctamente', data });
  } catch (err) { next(err); }
};

const createAlumno = async (req, res, next) => {
  try {
    const {
      nombre, apellidos, grado, jornada, modalidad,
      telefono_estudiante, nombre_encargado, telefono_encargado,
      fecha_nacimiento, tipo_estudiante, uid_tarjeta,
    } = req.body;
    const data = await service.createAlumno({
      nombre, apellidos, grado, jornada, modalidad,
      telefono_estudiante, nombre_encargado, telefono_encargado,
      fecha_nacimiento, tipo_estudiante, uid_tarjeta,
    });
    res.status(201).json({ success: true, message: 'Alumno vendedor registrado correctamente', data });
  } catch (err) { next(err); }
};

const updateAlumno = async (req, res, next) => {
  try {
    const {
      nombre, apellidos, grado, jornada, modalidad,
      telefono_estudiante, nombre_encargado, telefono_encargado,
      fecha_nacimiento, tipo_estudiante, uid_tarjeta, estado,
    } = req.body;
    const data = await service.updateAlumno(req.params.id, {
      nombre, apellidos, grado, jornada, modalidad,
      telefono_estudiante, nombre_encargado, telefono_encargado,
      fecha_nacimiento, tipo_estudiante, uid_tarjeta, estado,
    });
    res.json({ success: true, message: 'Alumno vendedor actualizado correctamente', data });
  } catch (err) { next(err); }
};

const desactivarAlumno = async (req, res, next) => {
  try {
    const data = await service.desactivarAlumno(req.params.id);
    res.json({ success: true, message: 'Alumno vendedor desactivado correctamente', data });
  } catch (err) { next(err); }
};

const buscarAlumnos = async (req, res, next) => {
  try {
    const data = await service.buscarAlumnos(req.params.termino);
    res.json({ success: true, message: 'Búsqueda de alumnos realizada correctamente', data });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────
// BOLETOS DE PREVENTA
// ─────────────────────────────────────────

const getAllBoletos = async (req, res, next) => {
  try {
    const data = await service.getAllBoletos();
    res.json({ success: true, message: 'Boletos obtenidos correctamente', data });
  } catch (err) { next(err); }
};

const getBoletoById = async (req, res, next) => {
  try {
    const data = await service.getBoletoById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Boleto no encontrado' });
    res.json({ success: true, message: 'Boleto obtenido correctamente', data });
  } catch (err) { next(err); }
};

const asignarBoleto = async (req, res, next) => {
  try {
    const { alumno_id } = req.body;
    const data = await service.asignarBoleto({ alumno_id });
    res.status(201).json({ success: true, message: 'Boleto asignado correctamente', data });
  } catch (err) { next(err); }
};

const asignarMultiple = async (req, res, next) => {
  try {
    const { alumno_id, cantidad } = req.body;
    const data = await service.asignarMultiple({ alumno_id, cantidad });
    res.status(201).json({
      success: true,
      message: `${data.length} boleto(s) asignado(s) correctamente`,
      data,
    });
  } catch (err) { next(err); }
};

const marcarVendido = async (req, res, next) => {
  try {
    const { nombre_comprador, categoria, talla_tshirt, monto, metodo_pago, observacion } = req.body;
    const data = await service.marcarVendido(req.params.id, {
      nombre_comprador, categoria, talla_tshirt, monto, metodo_pago, observacion,
    });
    res.json({ success: true, message: 'Boleto marcado como vendido correctamente', data });
  } catch (err) { next(err); }
};

const marcarNoVendido = async (req, res, next) => {
  try {
    const { observacion } = req.body;
    const data = await service.marcarNoVendido(req.params.id, { observacion });
    res.json({ success: true, message: 'Boleto marcado como no vendido correctamente', data });
  } catch (err) { next(err); }
};

const anularBoleto = async (req, res, next) => {
  try {
    const { observacion } = req.body;
    const data = await service.anularBoleto(req.params.id, { observacion });
    res.json({ success: true, message: 'Boleto anulado correctamente', data });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────
// CONSULTAS Y RESÚMENES
// ─────────────────────────────────────────

const getResumenAlumnos = async (req, res, next) => {
  try {
    const data = await service.getResumenAlumnos();
    res.json({ success: true, message: 'Resumen por alumnos obtenido correctamente', data });
  } catch (err) { next(err); }
};

const getDashboardGeneral = async (req, res, next) => {
  try {
    const data = await service.getDashboardGeneral();
    res.json({ success: true, message: 'Dashboard general obtenido correctamente', data });
  } catch (err) { next(err); }
};

const getBoletosByEstado = async (req, res, next) => {
  try {
    const data = await service.getBoletosByEstado(req.params.estado);
    res.json({ success: true, message: 'Boletos filtrados por estado', data });
  } catch (err) { next(err); }
};

const getBoletosByAlumno = async (req, res, next) => {
  try {
    const data = await service.getBoletosByAlumno(req.params.alumno_id);
    res.json({ success: true, message: 'Boletos del alumno obtenidos correctamente', data });
  } catch (err) { next(err); }
};

const buscarBoletos = async (req, res, next) => {
  try {
    const data = await service.buscarBoletos(req.params.termino);
    res.json({ success: true, message: 'Búsqueda realizada correctamente', data });
  } catch (err) { next(err); }
};

module.exports = {
  getAllAlumnos, getAlumnoById, createAlumno, updateAlumno, desactivarAlumno,
  buscarAlumnos,
  getAllBoletos, getBoletoById, asignarBoleto, asignarMultiple,
  marcarVendido, marcarNoVendido, anularBoleto,
  getResumenAlumnos, getDashboardGeneral,
  getBoletosByEstado, getBoletosByAlumno, buscarBoletos,
};
