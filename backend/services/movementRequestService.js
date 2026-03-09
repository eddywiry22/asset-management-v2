const { Op } = require('sequelize');
const { MovementRequest, User } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Build a WHERE clause for "requests requiring this user's action".
 *
 * MovementRequest.status ENUM: PENDING, APPROVED, IN_TRANSIT, COMPLETED, CANCELLED, REJECTED
 */
function requiresActionWhere(user) {
  if (user.role === 'warehouse_head') {
    // Head approves requests that are still pending initial approval
    return { status: 'PENDING' };
  }
  if (user.role === 'warehouse_operator') {
    // Destination-side: requests targeting this operator's location awaiting their approval
    // (IN_TRANSIT = head-approved, awaiting destination confirmation)
    // plus their own rejected requests so they can act on feedback
    return {
      [Op.or]: [
        { status: 'IN_TRANSIT', toLocationId: user.locationId },
        { status: 'REJECTED', requestedBy: user.id },
      ],
    };
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
    if (user.role === 'warehouse_operator') {
      // See own requests plus requests destined for their location
      where[Op.or] = [
        { toLocationId: user.locationId },
        { requestedBy: user.id },
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
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });
}

/**
 * Create a new movement request (warehouse_operator role).
 *
 * BUG-02 fix: use the correct Sequelize camelCase attribute names that match
 * the MovementRequest model definition (fromLocationId, toLocationId, requestedBy)
 * rather than the raw snake_case DB column names that Sequelize silently ignores.
 */
async function create(data, user) {
  const { fromLocationId, toLocationId } = data;

  if (!fromLocationId || !toLocationId) {
    throw new AppError('fromLocationId and toLocationId are required', 400);
  }

  if (Number(fromLocationId) === Number(toLocationId)) {
    throw new AppError('Origin and destination locations cannot be the same', 400);
  }

  // BUG-R3-04: Duplicate detection — block if an active (non-finalized) request
  // already exists for the same requester, origin, and destination.
  // Active statuses in this simplified model: PENDING, IN_TRANSIT.
  const duplicate = await MovementRequest.findOne({
    where: {
      requestedBy: user.id,
      fromLocationId,
      toLocationId,
      status: { [Op.in]: ['PENDING', 'IN_TRANSIT'] },
    },
  });
  if (duplicate) {
    throw new AppError(
      `A duplicate active movement request (ID: ${duplicate.id}) already exists for this route`,
      409
    );
  }

  return MovementRequest.create({
    requestedBy: user.id,
    fromLocationId,
    toLocationId,
    status: 'PENDING',
  });
}

/**
 * Approve or reject a movement request.
 *
 * BUG-10 fix: use the correct status ENUM values defined on the MovementRequest
 * model (PENDING → IN_TRANSIT → APPROVED) instead of the MovementHeader workflow
 * statuses (PENDING_HEAD_APPROVAL, PENDING_DESTINATION_APPROVAL) which are NOT
 * valid for this model and cause runtime ENUM constraint failures.
 *
 * Role mapping:
 *   warehouse_head    approves PENDING       → IN_TRANSIT
 *   warehouse_operator at destination approves IN_TRANSIT → APPROVED
 */
async function updateStatus(id, action, reviewerUser, rejectionReason) {
  const request = await MovementRequest.findByPk(id);
  if (!request) throw new AppError('Movement request not found', 404);

  const { role } = reviewerUser;

  if (action === 'approve') {
    if (role === 'warehouse_head' && request.status === 'PENDING') {
      request.status = 'IN_TRANSIT';
    } else if (role === 'warehouse_operator' && request.status === 'IN_TRANSIT') {
      request.status = 'APPROVED';
    } else {
      throw new AppError('You cannot approve this request in its current state', 403);
    }
  } else if (action === 'reject') {
    if (
      (role === 'warehouse_head' && request.status === 'PENDING') ||
      (role === 'warehouse_operator' && request.status === 'IN_TRANSIT')
    ) {
      request.status = 'REJECTED';
    } else {
      throw new AppError('You cannot reject this request in its current state', 403);
    }
  } else {
    throw new AppError('Invalid action', 400);
  }

  return request.save();
}

module.exports = { getNotificationCount, getAll, create, updateStatus };
