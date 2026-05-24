const { Router } = require('express');
const controller = require('../controllers/preventa.controller');

const router = Router();

// ─── Alumnos vendedores ───────────────────
router.get('/alumnos',      controller.getAllAlumnos);
router.get('/alumnos/:id',  controller.getAlumnoById);
router.post('/alumnos',     controller.createAlumno);
router.put('/alumnos/:id',  controller.updateAlumno);
router.delete('/alumnos/:id', controller.desactivarAlumno);

// ─── Consultas generales ─────────────────
router.get('/alumnos/buscar/:termino', controller.buscarAlumnos);
router.get('/resumen-alumnos',   controller.getResumenAlumnos);
router.get('/dashboard-general', controller.getDashboardGeneral);

// ─── Boletos — rutas específicas primero ─
router.get('/boletos/estado/:estado',        controller.getBoletosByEstado);
router.get('/boletos/alumno/:alumno_id',     controller.getBoletosByAlumno);
router.get('/boletos/buscar/:termino',       controller.buscarBoletos);
router.post('/boletos/asignar-multiple',     controller.asignarMultiple);

// ─── Boletos — CRUD base ─────────────────
router.get('/boletos',         controller.getAllBoletos);
router.get('/boletos/:id',     controller.getBoletoById);
router.post('/boletos',        controller.asignarBoleto);

// ─── Boletos — acciones de control ───────
router.put('/boletos/:id/vendido',    controller.marcarVendido);
router.put('/boletos/:id/no-vendido', controller.marcarNoVendido);
router.put('/boletos/:id/anular',     controller.anularBoleto);

module.exports = router;
