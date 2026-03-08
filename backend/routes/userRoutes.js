const { Router } = require('express');
const Joi = require('joi');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const VALID_ROLES = ['admin', 'manager', 'viewer', 'warehouse_operator', 'warehouse_head', 'destination_operator'];

const createSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).max(255).required(),
  role: Joi.string().valid(...VALID_ROLES).default('viewer'),
  phoneNumber: Joi.string().max(20).allow('', null).optional(),
  locationId: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().email().max(150).optional(),
  password: Joi.string().min(8).max(255).optional(),
  role: Joi.string().valid(...VALID_ROLES).optional(),
  phoneNumber: Joi.string().max(20).allow('', null).optional(),
  locationId: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
}).min(1);

const querySchema = Joi.object({
  search: Joi.string().allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  role: Joi.string().valid(...VALID_ROLES).optional(),
});

// All user management routes require authentication + admin or warehouse_head role
router.use(authenticate);
router.use(authorize('admin', 'warehouse_head'));

// GET /api/users
router.get('/', validate(querySchema, 'query'), userController.list);

// GET /api/users/:id
router.get('/:id', userController.getOne);

// GET /api/users/:id/impact
router.get('/:id/impact', userController.getImpact);

// POST /api/users  (admin only for creating users)
router.post('/', authorize('admin'), validate(createSchema), userController.create);

// PUT /api/users/:id
router.put('/:id', validate(updateSchema), userController.update);

// DELETE /api/users/:id  (admin only)
router.delete('/:id', authorize('admin'), userController.remove);

module.exports = router;
