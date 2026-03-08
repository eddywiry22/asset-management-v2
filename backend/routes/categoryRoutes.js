const { Router } = require('express');
const Joi = require('joi');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const querySchema = Joi.object({
  search: Joi.string().allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  includeInactive: Joi.string().valid('true', 'false').optional(),
});

// All category routes require authentication
router.use(authenticate);

// GET /api/categories
router.get('/', validate(querySchema, 'query'), categoryController.list);

// GET /api/categories/:id
router.get('/:id', categoryController.getOne);

// GET /api/categories/:id/impact
router.get('/:id/impact', categoryController.getImpact);

// POST /api/categories  (admin & warehouse_head only)
router.post(
  '/',
  authorize('admin', 'warehouse_head'),
  validate(createSchema),
  categoryController.create
);

// PUT /api/categories/:id  (admin & warehouse_head only)
router.put(
  '/:id',
  authorize('admin', 'warehouse_head'),
  validate(updateSchema),
  categoryController.update
);

// DELETE /api/categories/:id  (admin & warehouse_head only)
router.delete('/:id', authorize('admin', 'warehouse_head'), categoryController.remove);

module.exports = router;
