const { Op } = require('sequelize');
const { MovementRequest, User } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Build a WHERE clause for "requests requiring this user's action".
 */
function requiresActionWhere(user) {
  if (user.role === 'warehouse_head') {
    return { status: 'PENDING_HEAD_APPROVAL' };
  }
  if (user.role === 'operator') {
    return {
      status: 'PENDING_DESTINATION_APPROVAL',
      destination_location_id: user.location_id,
    };
  }
  if (user.role === 'requester') {
    return { status: 'REJECTED', requester_id: user.id };
  }
  return null; // other roles have no action-required items
}

/**
 * Count movement requests that require action from the given user.
 */
async function getNotificationCount(user) {
  const where = requiresActionWhere(user);
  if (!where) return 0;
  return MovementRequest.count({ where });
}

/**
 * List movement requests with optional filters.
 *
 * @param {object} filters - { requiresMyAction, status, page, limit }
 * @param {object} user    - The authenticated user
 */
async function getAll(filters, user) {
  const { requiresMyAction, status, page = 1, limit = 20 } = filters;
  const where = {};

  if (requiresMyAction === 'true' || requiresMyAction === true) {
    const actionWhere = requiresActionWhere(user);
    if (actionWhere) Object.assign(where, actionWhere);
    else return { rows: [], count: 0 }; // role has no action items
  } else {
    // Non-admin roles can only see their own requests or those relevant to them
    if (user.role === 'requester') {
      where.requester_id = user.id;
    } else if (user.role === 'operator') {
      where[Op.or] = [
        { destination_location_id: user.location_id },
        { requester_id: user.id },
      ];
    }
    // warehouse_head, admin, manager see all
  }

  if (status) {
    where.status = status;
  }

  const offset = (Number(page) - 1) * Number(limit);

  return MovementRequest.findAndCountAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] },
      { model: User, as: 'reviewer', attributes: ['id', 'name', 'email', 'role'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });
}

/**
 * Create a new movement request (requester role).
 */
async function create(data, user) {
  return MovementRequest.create({
    requester_id: user.id,
    asset_description: data.asset_description,
    source_location_id: data.source_location_id,
    destination_location_id: data.destination_location_id,
    notes: data.notes || null,
    status: 'PENDING_HEAD_APPROVAL',
  });
}

/**
 * Approve or reject a movement request.
 */
async function updateStatus(id, action, reviewerUser, rejectionReason) {
  const request = await MovementRequest.findByPk(id);
  if (!request) throw new AppError('Movement request not found', 404);

  const { role } = reviewerUser;

  if (action === 'approve') {
    if (role === 'warehouse_head' && request.status === 'PENDING_HEAD_APPROVAL') {
      request.status = 'PENDING_DESTINATION_APPROVAL';
    } else if (role === 'operator' && request.status === 'PENDING_DESTINATION_APPROVAL') {
      request.status = 'APPROVED';
    } else {
      throw new AppError('You cannot approve this request in its current state', 403);
    }
  } else if (action === 'reject') {
    if (
      (role === 'warehouse_head' && request.status === 'PENDING_HEAD_APPROVAL') ||
      (role === 'operator' && request.status === 'PENDING_DESTINATION_APPROVAL')
    ) {
      request.status = 'REJECTED';
      request.rejection_reason = rejectionReason || null;
    } else {
      throw new AppError('You cannot reject this request in its current state', 403);
    }
  } else {
    throw new AppError('Invalid action', 400);
  }

  request.reviewed_by = reviewerUser.id;
  return request.save();
}

module.exports = { getNotificationCount, getAll, create, updateStatus };
