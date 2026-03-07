const { Router } = require('express');
const Joi = require('joi');
const stockAdjustmentController = require('../controllers/stockAdjustmentController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const requestSchema = Joi.object({
  goods_id: Joi.number().integer().positive().required(),
  location_id: Joi.number().integer().positive().required(),
  adjustment_type: Joi.string().valid('add', 'subtract', 'set').required(),
  quantity: Joi.number().positive().required(),
  reason: Joi.string().allow('', null).optional(),
});

const reviewSchema = Joi.object({
  review_note: Joi.string().allow('', null).optional(),
});

const querySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  stock_id: Joi.number().integer().positive().optional(),
});

router.use(authenticate);

// GET /api/stock-adjustments
router.get('/', validate(querySchema, 'query'), stockAdjustmentController.getAll);

// GET /api/stock-adjustments/:id
router.get('/:id', stockAdjustmentController.getById);

// POST /api/stock-adjustments  – any authenticated user can request an adjustment
router.post('/', validate(requestSchema), stockAdjustmentController.requestAdjustment);

// POST /api/stock-adjustments/:id/approve  (admin, manager only)
router.post(
  '/:id/approve',
  authorize('admin', 'manager'),
  validate(reviewSchema),
  stockAdjustmentController.approveAdjustment
);

// POST /api/stock-adjustments/:id/reject  (admin, manager only)
router.post(
  '/:id/reject',
  authorize('admin', 'manager'),
  validate(reviewSchema),
  stockAdjustmentController.rejectAdjustment
);

module.exports = router;
