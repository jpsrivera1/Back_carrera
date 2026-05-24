const { Router } = require('express');
const controller = require('../controllers/participantes.controller');

const router = Router();

router.get('/buscar/:termino', controller.buscar);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.cancelar);

module.exports = router;
