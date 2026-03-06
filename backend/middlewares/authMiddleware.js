const { verifyToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');
const { User } = require('../models');
const { hasPermission } = require('../config/permissions');

/**
 * requireAuth – validates the Bearer token and attaches the user to req.user.
 * Rejects with 401 if the token is missing, invalid, or the user is inactive.
 */
const requireAuth = async (req, res, next) => {
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
 * checkPermission – enforces module-level action permissions.
 * Must be used AFTER requireAuth.
 *
 * @param {string} module - e.g. 'assets', 'users', 'reports'
 * @param {string} action - e.g. 'view', 'create', 'edit', 'delete', 'export'
 *
 * @example
 *   router.get('/assets', requireAuth, checkPermission('assets', 'view'), assetController.list);
 *   router.post('/assets', requireAuth, checkPermission('assets', 'create'), assetController.create);
 */
const checkPermission = (module, action) => (req, res, next) => {
  if (!req.user) {
    return unauthorized(res);
  }

  if (!hasPermission(req.user.role, module, action)) {
    return forbidden(
      res,
      `You don't have permission to perform '${action}' on '${module}'`
    );
  }

  return next();
};

/**
 * authorize – restricts access to specific roles (legacy helper kept for
 * backwards compatibility with simple role gates).
 * Must be used AFTER requireAuth.
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

// Keep `authenticate` as an alias so existing code keeps working.
const authenticate = requireAuth;

module.exports = { requireAuth, authenticate, authorize, checkPermission };
