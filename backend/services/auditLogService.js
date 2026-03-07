const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create an audit log entry.
 * Can be called from controllers/services throughout the app.
 *
 * Field mapping matches the AuditLog model:
 *   userId, action, entity, entityId, before, after
 */
const createAuditLog = async ({ userId, action, entity, entityId, before, after }) => {
  let userEmail = null;
  if (userId) {
    const { User: UserModel } = require('../models');
    const actor = await UserModel.findByPk(userId, { attributes: ['email'] });
    userEmail = actor ? actor.email : null;
  }

  return AuditLog.create({
    userId: userId ?? null,
    userEmail,
    action: action ?? 'UNKNOWN',
    entity: entity ?? 'UNKNOWN',
    entityId: entityId ?? null,
    before: before ?? null,
    after: after ?? null,
  });
};

/**
 * Get paginated audit logs with optional filters.
 * Uses camelCase field names that match the AuditLog model.
 */
const getAuditLogs = async ({ entity, userId, dateFrom, dateTo, page = 1, limit = 20 }) => {
  const where = {};

  if (entity) {
    where.entity = entity;
  }

  if (userId) {
    where.userId = userId;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt[Op.gte] = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return {
    logs: rows,
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)),
  };
};

/**
 * Get distinct entity names for filter dropdown.
 */
const getEntityNames = async () => {
  const results = await AuditLog.findAll({
    attributes: ['entity'],
    group: ['entity'],
    order: [['entity', 'ASC']],
  });
  return results.map((r) => r.entity);
};

module.exports = { createAuditLog, getAuditLogs, getEntityNames };
