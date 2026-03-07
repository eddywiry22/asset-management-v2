const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create an audit log entry.
 * Can be called from controllers/services throughout the app.
 */
const createAuditLog = async ({ userId, moduleName, entityId, actionType, oldValue, newValue, description }) => {
  return AuditLog.create({
    user_id: userId ?? null,
    module_name: moduleName,
    entity_id: entityId ? String(entityId) : null,
    action_type: actionType,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    description: description ?? null,
  });
};

/**
 * Get paginated audit logs with optional filters.
 */
const getAuditLogs = async ({ moduleName, userId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const where = {};

  if (moduleName) {
    where.module_name = moduleName;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      // Include the full dateTo day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    logs: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * Get distinct module names for filter dropdown.
 */
const getModuleNames = async () => {
  const results = await AuditLog.findAll({
    attributes: ['module_name'],
    group: ['module_name'],
    order: [['module_name', 'ASC']],
  });
  return results.map((r) => r.module_name);
};

module.exports = { createAuditLog, getAuditLogs, getModuleNames };
