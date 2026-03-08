const { Router } = require('express');
const Joi = require('joi');
const movementController = require('../controllers/movementController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

// All movement routes require authentication
router.use(authenticate);

// Validation schemas
// Using goodsId (references Goods table – single source of truth for products)
const itemSchema = Joi.object({
  goodsId: Joi.number().integer().positive().required(),
  quantity: Joi.number().positive().required(),
});

const createSchema = Joi.object({
  originLocationId: Joi.number().integer().positive().required(),
  destinationLocationId: Joi.number().integer().positive().required(),
  notes: Joi.string().max(1000).allow('', null).optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const previewSchema = Joi.object({
  originLocationId: Joi.number().integer().positive().required(),
  destinationLocationId: Joi.number().integer().positive().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

// Rejection reason is mandatory (min 5 chars) to ensure meaningful feedback
const rejectSchema = Joi.object({
  reason: Joi.string().min(5).max(1000).required(),
});

const listQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      'PENDING_HEAD_APPROVAL',
      'PENDING_DESTINATION_APPROVAL',
      'APPROVED_READY_FOR_FINALIZATION',
      'COMPLETED',
      'REJECTED'
    )
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// POST /api/movements/preview – compute qty snapshots without saving
router.post('/preview', validate(previewSchema), movementController.preview);

// POST /api/movements – warehouse operators create movement requests
router.post(
  '/',
  authorize('admin', 'warehouse_operator', 'warehouse_head'),
  validate(createSchema),
  movementController.create
);

// GET /api/movements – list movements
router.get('/', validate(listQuerySchema, 'query'), movementController.list);

// GET /api/movements/:id – get single movement
router.get('/:id', movementController.getOne);

// POST /api/movements/:id/approve-head – warehouse head approves first stage
router.post(
  '/:id/approve-head',
  authorize('admin', 'warehouse_head'),
  movementController.approveHead
);

// POST /api/movements/:id/approve-dest – destination-side actor approves second stage
// BUG-R9-01 fix: warehouse_operator at the destination location is now also
// permitted. Authority is derived from locationId ownership in the service layer,
// not from a distinct role name.
router.post(
  '/:id/approve-dest',
  authorize('admin', 'destination_operator', 'warehouse_operator'),
  movementController.approveDest
);

// POST /api/movements/:id/finalize – finalize and update stock
// BUG-R9-02 fix: authority is now destination-location-based. Both the
// destination warehouse_operator and the destination warehouse_head may
// finalize — the service enforces the locationId ownership check.
// warehouse_head removed from the original head-approval–only role to match
// the updated workflow where any destination-assigned actor can close the movement.
router.post(
  '/:id/finalize',
  authorize('admin', 'warehouse_operator', 'warehouse_head'),
  movementController.finalize
);

// POST /api/movements/:id/reject – reject with mandatory reason (pre-finalization stages only)
// BUG-R9-01 / BUG-R9-03 fix: warehouse_operator at the destination location may
// now reject at PENDING_HEAD_APPROVAL or PENDING_DESTINATION_APPROVAL.
// Location ownership and stage guards are enforced in the service layer.
router.post(
  '/:id/reject',
  authorize('admin', 'warehouse_head', 'destination_operator', 'warehouse_operator'),
  validate(rejectSchema),
  movementController.reject
);

// POST /api/movements/:id/recall – post-approval recall for APPROVED_READY_FOR_FINALIZATION
// BUG-R9-04 / BUG-R9-05 fix: provides a recall transition for fully-approved
// movements that cannot be rejected through the standard reject endpoint.
// Accessible to origin/destination warehouse_head, destination operators, admin.
router.post(
  '/:id/recall',
  authorize('admin', 'manager', 'warehouse_head', 'warehouse_operator', 'destination_operator'),
  validate(rejectSchema),
  movementController.recall
);

// POST /api/movements/:id/cancel – warehouse_operator withdraws their own pending request
// BUG-08: provides a cancellation path so operators can correct mistakes without admin help.
router.post(
  '/:id/cancel',
  authorize('admin', 'warehouse_operator'),
  movementController.cancel
);

module.exports = router;
