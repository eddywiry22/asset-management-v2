const Joi = require('joi');
const { Movement, AuditLog, User } = require('../models');
const { success, created, badRequest, forbidden, notFound } = require('../utils/response');
const AppError = require('../utils/AppError');

// ── Validation schemas ────────────────────────────────────────────────────

const createSchema = Joi.object({
  asset_name: Joi.string().max(150).required(),
  from_location: Joi.string().max(150).required(),
  to_location: Joi.string().max(150).required(),
  purpose: Joi.string().max(1000).allow('', null).optional(),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().min(5).max(1000).required().messages({
    'string.min': 'Rejection reason must be at least 5 characters',
    'any.required': 'Rejection reason is required',
  }),
});

// ── Helpers ───────────────────────────────────────────────────────────────

const REQUESTER_INCLUDE = [
  { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
];

async function writeAuditLog({ entityId, action, performedById, metadata = null }) {
  await AuditLog.create({
    entity_type: 'movement',
    entity_id: entityId,
    action,
    performed_by_id: performedById,
    metadata,
  });
}

// ── Controllers ───────────────────────────────────────────────────────────

/**
 * GET /api/movements
 * List all movements, newest first.
 */
const list = async (req, res, next) => {
  try {
    const movements = await Movement.findAll({
      include: REQUESTER_INCLUDE,
      order: [['createdAt', 'DESC']],
    });
    return success(res, movements, 'Movements retrieved');
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/movements
 * Create a new movement request (any authenticated user).
 */
const create = async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/['"]/g, '') }));
      return badRequest(res, 'Validation failed', errors);
    }

    const movement = await Movement.create({ ...value, requested_by_id: req.user.id });

    await writeAuditLog({
      entityId: movement.id,
      action: 'created',
      performedById: req.user.id,
      metadata: { asset_name: movement.asset_name, from_location: movement.from_location, to_location: movement.to_location },
    });

    const result = await Movement.findByPk(movement.id, { include: REQUESTER_INCLUDE });
    return created(res, result, 'Movement request created');
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/movements/:id/approve
 * Approve a pending movement. Cannot approve own request.
 * Restricted to admin and manager roles.
 */
const approve = async (req, res, next) => {
  try {
    const movement = await Movement.findByPk(req.params.id, { include: REQUESTER_INCLUDE });
    if (!movement) return notFound(res, 'Movement not found');

    if (movement.status !== 'pending') {
      return badRequest(res, `Movement is already ${movement.status}`);
    }

    if (movement.requested_by_id === req.user.id) {
      return forbidden(res, 'You cannot approve your own movement request');
    }

    await movement.update({ status: 'approved', approved_by_id: req.user.id });

    await writeAuditLog({
      entityId: movement.id,
      action: 'approved',
      performedById: req.user.id,
      metadata: { previous_status: 'pending' },
    });

    const result = await Movement.findByPk(movement.id, { include: REQUESTER_INCLUDE });
    return success(res, result, 'Movement approved');
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/movements/:id/reject
 * Reject a pending movement with a mandatory reason.
 * Restricted to admin and manager roles.
 */
const reject = async (req, res, next) => {
  try {
    const { error, value } = rejectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/['"]/g, '') }));
      return badRequest(res, 'Validation failed', errors);
    }

    const movement = await Movement.findByPk(req.params.id, { include: REQUESTER_INCLUDE });
    if (!movement) return notFound(res, 'Movement not found');

    if (movement.status !== 'pending') {
      return badRequest(res, `Movement is already ${movement.status}`);
    }

    await movement.update({
      status: 'rejected',
      rejection_reason: value.rejection_reason,
      approved_by_id: req.user.id,
    });

    await writeAuditLog({
      entityId: movement.id,
      action: 'rejected',
      performedById: req.user.id,
      metadata: { rejection_reason: value.rejection_reason, previous_status: 'pending' },
    });

    const result = await Movement.findByPk(movement.id, { include: REQUESTER_INCLUDE });
    return success(res, result, 'Movement rejected');
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/movements/:id/audit-logs
 * Retrieve audit log entries for a specific movement.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const movement = await Movement.findByPk(req.params.id);
    if (!movement) return notFound(res, 'Movement not found');

    const logs = await AuditLog.findAll({
      where: { entity_type: 'movement', entity_id: req.params.id },
      include: [{ model: User, as: 'performedBy', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    return success(res, logs, 'Audit logs retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, create, approve, reject, getAuditLogs };
