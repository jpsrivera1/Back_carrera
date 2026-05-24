const { Router } = require('express');
const controller = require('../controllers/kits.controller');

const router = Router();

router.get('/pendientes', controller.getPendientes);
router.get('/entregados', controller.getEntregados);
router.get('/', controller.getAll);
router.put('/:participante_id/entregar', controller.entregar);
router.put('/:participante_id/revertir', controller.revertir);

module.exports = router;
