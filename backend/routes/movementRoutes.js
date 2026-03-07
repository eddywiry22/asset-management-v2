const { Router } = require('express');
const Joi = require('joi');
const movementController = require('../controllers/movementController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

// All movement routes require authentication
router.use(authenticate);

// Validation schemas
const itemSchema = Joi.object({
  itemId: Joi.number().integer().positive().required(),
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

const rejectSchema = Joi.object({
  reason: Joi.string().max(1000).allow('', null).optional(),
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

// POST /api/movements – create a new movement request (any authenticated user)
router.post('/', validate(createSchema), movementController.create);

// GET /api/movements – list movements
router.get('/', validate(listQuerySchema, 'query'), movementController.list);

// GET /api/movements/:id – get single movement
router.get('/:id', movementController.getOne);

// POST /api/movements/:id/approve-head – warehouse head approval (manager/admin)
router.post('/:id/approve-head', authorize('admin', 'manager'), movementController.approveHead);

// POST /api/movements/:id/approve-dest – destination approval (manager/admin)
router.post('/:id/approve-dest', authorize('admin', 'manager'), movementController.approveDest);

// POST /api/movements/:id/finalize – finalize and update stock (manager/admin)
router.post('/:id/finalize', authorize('admin', 'manager'), movementController.finalize);

// POST /api/movements/:id/reject – reject movement (manager/admin)
router.post('/:id/reject', authorize('admin', 'manager'), validate(rejectSchema), movementController.reject);

module.exports = router;
