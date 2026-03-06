const { Router } = require('express');
const Joi = require('joi');
const goodsController = require('../controllers/goodsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().max(200).required(),
  sku: Joi.string().max(100).required(),
  description: Joi.string().allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  sku: Joi.string().max(100).optional(),
  description: Joi.string().allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const querySchema = Joi.object({
  isActive: Joi.boolean().optional(),
});

// All routes require authentication
router.use(authenticate);

// GET /api/goods
router.get('/', validate(querySchema, 'query'), goodsController.getAll);

// GET /api/goods/:id
router.get('/:id', goodsController.getById);

// POST /api/goods  (admin, manager only)
router.post('/', authorize('admin', 'manager'), validate(createSchema), goodsController.create);

// PUT /api/goods/:id  (admin, manager only)
router.put('/:id', authorize('admin', 'manager'), validate(updateSchema), goodsController.update);

// DELETE /api/goods/:id  (admin only – soft delete/deactivate)
router.delete('/:id', authorize('admin'), goodsController.remove);

module.exports = router;
