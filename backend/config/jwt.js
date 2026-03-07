// BUG-14: JWT secrets must never fall back to hardcoded values.
// If the required env vars are absent the application must refuse to start —
// hardcoded fallbacks make tokens trivially forgeable in any environment where
// a developer forgets to set the vars (staging, CI, production).
const secret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!secret || !refreshSecret) {
  throw new Error(
    'JWT_SECRET and JWT_REFRESH_SECRET environment variables must be set. ' +
    'Refusing to start with insecure hardcoded fallback values.'
  );
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
