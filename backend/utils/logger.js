/**
 * Simple structured logger for audit-trail and application events.
 * Writes to console and appends to a daily log file in backend/logs/.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Returns the log file path for today (YYYY-MM-DD.log).
 */
const todayLogFile = () => {
  const today = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${today}.log`);
};

/**
 * Format a log entry as a JSON line.
 */
const formatEntry = (level, message, meta = {}) => {
  return (
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }) + '\n'
  );
};

/**
 * Write entry to file asynchronously (fire-and-forget).
 */
const writeToFile = (entry) => {
  fs.appendFile(todayLogFile(), entry, (err) => {
    if (err) console.error('[logger] Failed to write log file:', err.message);
  });
};

const info = (message, meta = {}) => {
  const entry = formatEntry('INFO', message, meta);
  if (process.env.NODE_ENV !== 'test') console.log(`[INFO]  ${message}`, Object.keys(meta).length ? meta : '');
  writeToFile(entry);
};

const warn = (message, meta = {}) => {
  const entry = formatEntry('WARN', message, meta);
  if (process.env.NODE_ENV !== 'test') console.warn(`[WARN]  ${message}`, Object.keys(meta).length ? meta : '');
  writeToFile(entry);
};

const error = (message, meta = {}) => {
  const entry = formatEntry('ERROR', message, meta);
  if (process.env.NODE_ENV !== 'test') console.error(`[ERROR] ${message}`, Object.keys(meta).length ? meta : '');
  writeToFile(entry);
};

/**
 * Audit log for CRUD changes.
 * @param {string} action - e.g. 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} resource - e.g. 'Category', 'Vendor'
 * @param {object} details - { id, by (userId), data }
 */
const audit = (action, resource, details = {}) => {
  const entry = formatEntry('AUDIT', `${action} ${resource}`, { action, resource, ...details });
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUDIT] ${action} ${resource}`, details);
  }
  writeToFile(entry);
};

module.exports = { info, warn, error, audit };
