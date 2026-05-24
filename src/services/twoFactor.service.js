const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const supabase = require('../config/db');

const APP_NAME = 'ControlCarrera';

/**
 * Genera un nuevo secreto TOTP y devuelve el secreto + QR code en base64.
 * No guarda nada en BD todavía (el usuario debe confirmar con un código válido).
 */
const generateSecret = async (userId, username) => {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${username})`,
    issuer: APP_NAME,
    length: 20,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * Habilita 2FA: verifica el código TOTP y guarda el secreto en la BD.
 */
const enable2FA = async (userId, secret, token) => {
  const valid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) {
    throw Object.assign(new Error('Código de verificación incorrecto'), { status: 400 });
  }

  const { error } = await supabase
    .from('usuarios')
    .update({ two_factor_secret: secret, two_factor_enabled: true })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  return { enabled: true };
};

/**
 * Deshabilita 2FA: verifica el código actual y limpia los campos en BD.
 */
const disable2FA = async (userId, token) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('two_factor_secret, two_factor_enabled')
    .eq('id', userId)
    .single();

  if (error || !data) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
  if (!data.two_factor_enabled) throw Object.assign(new Error('El 2FA no está activado'), { status: 400 });

  const valid = speakeasy.totp.verify({
    secret: data.two_factor_secret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!valid) {
    throw Object.assign(new Error('Código de verificación incorrecto'), { status: 400 });
  }

  const { error: updError } = await supabase
    .from('usuarios')
    .update({ two_factor_secret: null, two_factor_enabled: false })
    .eq('id', userId);

  if (updError) throw new Error(updError.message);

  return { disabled: true };
};

/**
 * Verifica el código TOTP durante el proceso de login (segundo factor).
 */
const verifyLoginToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
};

module.exports = { generateSecret, enable2FA, disable2FA, verifyLoginToken };
