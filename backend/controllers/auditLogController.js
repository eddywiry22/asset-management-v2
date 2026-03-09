const auditLogService = require('../services/auditLogService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const getLogs = async (req, res, next) => {
  try {
    const { entity, user_id, date_from, date_to, page, limit } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    if (parsedPage < 1) throw new AppError('Page must be >= 1', 400);

    const result = await auditLogService.getAuditLogs({
      entity: entity || null,
      userId: user_id ? parseInt(user_id, 10) : null,
      dateFrom: date_from || null,
      dateTo: date_to || null,
      page: parsedPage,
      limit: parsedLimit,
    });

    return success(res, result.logs, 'Audit logs retrieved', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    return next(err);
  }
};

const getModules = async (req, res, next) => {
  try {
    const entities = await auditLogService.getEntityNames();
    return success(res, entities, 'Entities retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getLogs, getModules };
