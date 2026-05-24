const jwt = require('jsonwebtoken');
const { login } = require('../services/auth.service');
const { generateSecret, enable2FA, disable2FA, verifyLoginToken } = require('../services/twoFactor.service');
const supabase = require('../config/db');

// ─── Utilidad interna ──────────────────────────────────────────────────────────

const signFullToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// Token temporal de corta duración solo para completar el paso 2FA
const signTempToken = (userId) =>
  jwt.sign(
    { id: userId, type: '2fa_pending' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

// ─── Controladores ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Si el usuario tiene 2FA activo devuelve { requires2FA: true, tempToken }.
 * Si no tiene 2FA devuelve { user, token } directamente.
 */
const loginController = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);

    if (result.requires2FA) {
      const tempToken = signTempToken(result.userId);
      return res.json({ success: true, requires2FA: true, tempToken });
    }

    const token = signFullToken(result.user);
    res.json({ success: true, data: { user: result.user, token } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/verify-login
 * Body: { tempToken, code }
 * Verifica el código TOTP y emite el JWT completo.
 */
const verifyLoginTwoFA = async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'tempToken y code son requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Token temporal inválido o expirado' });
    }

    if (decoded.type !== '2fa_pending') {
      return res.status(401).json({ success: false, message: 'Token no válido para este paso' });
    }

    // Obtener el secreto 2FA del usuario
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, nombre_completo, rol, estado, two_factor_secret')
      .eq('id', decoded.id)
      .eq('estado', 'Activo')
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const valid = verifyLoginToken(data.two_factor_secret, code.replace(/\s/g, ''));
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Código de verificación incorrecto' });
    }

    const { two_factor_secret, ...user } = data;
    const token = signFullToken(user);
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/setup
 * Genera secreto + QR code para que el usuario escanee. Requiere JWT válido.
 */
const setupTwoFA = async (req, res, next) => {
  try {
    const result = await generateSecret(req.user.id, req.user.username);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/enable
 * Body: { secret, code }
 * Activa 2FA después de confirmar que el usuario escaneó correctamente. Requiere JWT.
 */
const enableTwoFA = async (req, res, next) => {
  try {
    const { secret, code } = req.body;
    if (!secret || !code) {
      return res.status(400).json({ success: false, message: 'secret y code son requeridos' });
    }
    const result = await enable2FA(req.user.id, secret, code.replace(/\s/g, ''));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/disable
 * Body: { code }
 * Desactiva 2FA verificando el código actual. Requiere JWT.
 */
const disableTwoFA = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'code es requerido' });
    }
    const result = await disable2FA(req.user.id, code.replace(/\s/g, ''));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const meController = (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = {
  loginController,
  verifyLoginTwoFA,
  setupTwoFA,
  enableTwoFA,
  disableTwoFA,
  meController,
};

