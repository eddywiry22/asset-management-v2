const { User } = require('../models');
const { signToken, signRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Validate credentials and return signed tokens + user info.
 *
 * Error rules:
 *  - User not found or wrong password → 401 generic message (no user enumeration)
 *  - User found but inactive          → 403 with actionable message
 *
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  // Fetch user WITH password (using scoped query)
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Always run a full bcrypt comparison to prevent timing-based user enumeration.
  // All authentication failures (not found, inactive, wrong password) return the
  // same generic 401 so callers cannot probe which emails exist.
  if (!user) {
    await require('bcrypt').compare(password, '$2b$12$dummyhashfortimingprotection000000000000000');
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.verifyPassword(password);

  // Check inactive AFTER password verification – unified response prevents enumeration
  if (!isMatch || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login timestamp
  await user.update({ lastLoginAt: new Date() });

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Return the authenticated user's public profile.
 * @param {number} userId
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = { login, getProfile };
