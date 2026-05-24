const express = require('express');
const {
  loginController,
  verifyLoginTwoFA,
  setupTwoFA,
  enableTwoFA,
  disableTwoFA,
  meController,
} = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Autenticación básica
router.post('/login', loginController);
router.get('/me', authMiddleware, meController);

// Segundo factor durante el login (no requiere JWT completo, usa tempToken)
router.post('/2fa/verify-login', verifyLoginTwoFA);

// Gestión de 2FA (requiere JWT válido)
router.post('/2fa/setup',   authMiddleware, setupTwoFA);
router.post('/2fa/enable',  authMiddleware, enableTwoFA);
router.post('/2fa/disable', authMiddleware, disableTwoFA);

module.exports = router;
