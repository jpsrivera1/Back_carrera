const { Router } = require('express');
const controller = require('../controllers/pagos.controller');

const router = Router();

router.get('/pendientes', controller.getPendientes);
router.get('/pagados', controller.getPagados);
router.get('/', controller.getAll);
router.put('/:participante_id', controller.updatePago);

module.exports = router;
