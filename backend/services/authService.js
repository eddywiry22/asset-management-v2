const { User } = require('../models');
const { signToken, signRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Validate credentials and return signed tokens + user info.
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  // Fetch user WITH password (using scoped query)
  const user = await User.scope('withPassword').findOne({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.verifyPassword(password);
  if (!isMatch) {
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
