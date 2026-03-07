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
  category: Joi.string().trim().max(100).required(),
  vendor: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(2000).allow('', null).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateSchema = Joi.object({
  product_id: Joi.string().trim().max(100).optional(),
  name: Joi.string().trim().min(1).max(200).optional(),
  category: Joi.string().trim().max(100).optional(),
  vendor: Joi.string().trim().max(150).optional(),
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

// GET /api/goods           – list all (admin + manager)
router.get('/', authorize('admin', 'manager'), validate(listQuerySchema, 'query'), goodsController.list);

// GET /api/goods/active    – list ACTIVE only (all roles, used by movement requests)
router.get('/active', goodsController.listActive);

// GET /api/goods/:id       – get one (admin + manager)
router.get('/:id', authorize('admin', 'manager'), validate(idParamSchema, 'params'), goodsController.getById);

// POST /api/goods          – create (admin + manager)
router.post('/', authorize('admin', 'manager'), validate(createSchema), goodsController.create);

// PUT /api/goods/:id       – full / partial update (admin + manager)
router.put('/:id', authorize('admin', 'manager'), validate(idParamSchema, 'params'), validate(updateSchema), goodsController.update);

// DELETE /api/goods/:id    – delete (admin only)
router.delete('/:id', authorize('admin'), validate(idParamSchema, 'params'), goodsController.remove);

module.exports = router;
