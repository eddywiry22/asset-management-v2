const { Router } = require('express');
const Joi = require('joi');
const goodsController = require('../controllers/goodsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

// All goods routes require authentication
router.use(authenticate);

// ─── Validation schemas ──────────────────────────────────────────────────────

const createSchema = Joi.object({
  product_id: Joi.string().trim().max(100).required(),
  name: Joi.string().trim().min(1).max(200).required(),
  category: Joi.number().integer().positive().required(),
  vendor: Joi.number().integer().positive().required(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateSchema = Joi.object({
  product_id: Joi.string().trim().max(100).optional(),
  name: Joi.string().trim().min(1).max(200).optional(),
  category: Joi.number().integer().positive().optional(),
  vendor: Joi.number().integer().positive().optional(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
}).min(1); // at least one field must be provided

const listQuerySchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  category: Joi.string().trim().optional(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/goods           – list all (admin + warehouse_head)
router.get('/', authorize('admin', 'warehouse_head'), validate(listQuerySchema, 'query'), goodsController.list);

// GET /api/goods/active    – list ACTIVE only (all roles, used by movement requests and stock adjustments)
router.get('/active', goodsController.listActive);

// GET /api/goods/:id       – get one (admin + warehouse_head)
router.get('/:id', authorize('admin', 'warehouse_head'), validate(idParamSchema, 'params'), goodsController.getById);

// GET /api/goods/:id/impact – impact summary for deactivation confirmation (admin + warehouse_head)
router.get('/:id/impact', authorize('admin', 'warehouse_head'), validate(idParamSchema, 'params'), goodsController.getImpact);

// POST /api/goods          – create (admin + warehouse_head)
router.post('/', authorize('admin', 'warehouse_head'), validate(createSchema), goodsController.create);

// PUT /api/goods/:id       – full / partial update (admin + warehouse_head)
router.put('/:id', authorize('admin', 'warehouse_head'), validate(idParamSchema, 'params'), validate(updateSchema), goodsController.update);

// DELETE /api/goods/:id    – delete (admin only)
router.delete('/:id', authorize('admin'), validate(idParamSchema, 'params'), goodsController.remove);

module.exports = router;
