const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const config = require('../config');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const register = async (userData) => {
  const { email, password, name, phone, role } = userData;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const password_hash = await bcrypt.hash(password, config.bcryptSaltRounds);

  const result = await query(
    `INSERT INTO users (email, password_hash, name, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role, created_at`,
    [email.toLowerCase(), password_hash, name.trim(), phone, role || 'trekker']
  );

  const user = result.rows[0];
  const tokens = await generateTokens(user);

  return { user, ...tokens };
};

const login = async (email, password) => {
  const result = await query(
    'SELECT id, email, password_hash, name, role, avatar_url, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const tokens = await generateTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
    },
    ...tokens,
  };
};

const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    await query('DELETE FROM refresh_tokens WHERE token = $1 AND user_id = $2', [refreshToken, userId]);
  }
};

const refreshToken = async (token) => {
  const result = await query(
    `SELECT rt.*, u.id as user_id, u.email, u.name, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = result.rows[0];

  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);

  const tokens = await generateTokens(user);

  return tokens;
};

const forgotPassword = async (email) => {
  const user = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (user.rows.length === 0) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000);

  await query(
    'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
    [resetToken, resetExpires, user.rows[0].id]
  );

  logger.info(`Password reset token for ${email}: ${resetToken}`);
  // In production, send email with reset link
};

const resetPassword = async (token, newPassword) => {
  const result = await query(
    'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const password_hash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
  await query(
    'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
    [password_hash, result.rows[0].id]
  );
};

const getMe = async (userId) => {
  const result = await query(
    `SELECT id, email, name, phone, avatar_url, role, medical_info,
            notification_preferences, is_verified, created_at, last_login_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return value * (multipliers[unit] || 86400000);
};

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshTokenValue = uuidv4() + '-' + crypto.randomBytes(24).toString('hex');
  const refreshMs = parseDuration(config.jwt.refreshExpiresIn);
  const refreshExpires = new Date(Date.now() + refreshMs);

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshTokenValue, refreshExpires]
  );

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn: config.jwt.expiresIn,
  };
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
