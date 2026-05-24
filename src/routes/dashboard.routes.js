const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');

const router = Router();

router.get('/tallas', controller.getTallas);
router.get('/categorias', controller.getCategorias);
router.get('/', controller.getResumen);

module.exports = router;
