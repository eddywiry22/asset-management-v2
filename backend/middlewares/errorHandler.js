const { ValidationError: SequelizeValidationError, UniqueConstraintError } = require('sequelize');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');

/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Log full error in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ErrorHandler]', err);
  }

  // Sequelize validation errors
  if (err instanceof SequelizeValidationError || err instanceof UniqueConstraintError) {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ success: false, message: 'Validation error', errors });
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // Operational errors thrown intentionally (AppError pattern)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  // Unknown / unexpected errors
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
