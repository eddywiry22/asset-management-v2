const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Sign an access token with the given payload.
 * @param {object} payload - Data to embed (e.g. { id, email, role })
 * @returns {string} Signed JWT string
 */
const signToken = (payload) =>
  jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

/**
 * Sign a refresh token.
 * @param {object} payload
 * @returns {string}
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyToken = (token) => jwt.verify(token, jwtConfig.secret);

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => jwt.verify(token, jwtConfig.refreshSecret);

module.exports = { signToken, signRefreshToken, verifyToken, verifyRefreshToken };
