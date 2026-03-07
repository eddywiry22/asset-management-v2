const movementRequestService = require('../services/movementRequestService');
const { success, created } = require('../utils/response');

const getNotificationCount = async (req, res, next) => {
  try {
    const count = await movementRequestService.getNotificationCount(req.user);
    return success(res, { count }, 'Notification count retrieved');
  } catch (err) {
    return next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { requiresMyAction, status, page, limit } = req.query;
    const result = await movementRequestService.getAll(
      { requiresMyAction, status, page, limit },
      req.user
    );
    return success(res, result.rows, 'Movement requests retrieved', 200, {
      total: result.count,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const request = await movementRequestService.create(req.body, req.user);
    return created(res, request, 'Movement request created');
  } catch (err) {
    return next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;
    const request = await movementRequestService.updateStatus(
      id,
      action,
      req.user,
      rejection_reason
    );
    return success(res, request, 'Movement request updated');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getNotificationCount, getAll, create, updateStatus };
