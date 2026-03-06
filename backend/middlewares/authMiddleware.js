const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');
const { User } = require('../models');

/**
 * Authenticate - validates the Bearer token and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or inactive');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err); // Passes JWT errors to the global error handler
  }
};

/**
 * Authorize - restricts access to specific roles.
 * Must be used AFTER authenticate.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'manager')
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }
    return next();
  };

module.exports = { authenticate, authorize };
