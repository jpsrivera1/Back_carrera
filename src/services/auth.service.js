const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

/**
 * Verifica credenciales contra la tabla `usuarios`.
 * El hash fue generado con pgcrypto crypt('pass', gen_salt('bf'))
 * que produce un hash bcrypt estándar compatible con bcryptjs.
 *
 * Retorna:
 *   { requires2FA: true, userId, two_factor_secret }  → si el usuario tiene 2FA activo
 *   { user }                                           → si no tiene 2FA (acceso directo)
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw Object.assign(new Error('Username y password son requeridos'), { status: 400 });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, username, nombre_completo, rol, estado, password_hash, two_factor_enabled, two_factor_secret')
    .eq('username', username)
    .eq('estado', 'Activo')
    .single();

  // Respuesta genérica para no revelar si el usuario existe
  if (error || !data) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  // Si tiene 2FA habilitado, indicar al controlador que se necesita el segundo factor
  if (data.two_factor_enabled) {
    return {
      requires2FA: true,
      userId: data.id,
      two_factor_secret: data.two_factor_secret,
    };
  }

  const { password_hash, two_factor_enabled, two_factor_secret, ...user } = data;
  return { user };
};

module.exports = { login };

