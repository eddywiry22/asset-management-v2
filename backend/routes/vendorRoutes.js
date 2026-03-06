const { Router } = require('express');
const Joi = require('joi');
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().max(150).required(),
  contactPerson: Joi.string().max(100).allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().max(20).allow('', null).optional(),
  address: Joi.string().max(2000).allow('', null).optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(150).optional(),
  contactPerson: Joi.string().max(100).allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().max(20).allow('', null).optional(),
  address: Joi.string().max(2000).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const querySchema = Joi.object({
  search: Joi.string().allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  includeInactive: Joi.string().valid('true', 'false').optional(),
});

// All vendor routes require authentication
router.use(authenticate);

// GET /api/vendors
router.get('/', validate(querySchema, 'query'), vendorController.list);

// GET /api/vendors/:id
router.get('/:id', vendorController.getOne);

// POST /api/vendors  (admin & manager only)
router.post(
  '/',
  authorize('admin', 'manager'),
  validate(createSchema),
  vendorController.create
);

// PUT /api/vendors/:id  (admin & manager only)
router.put(
  '/:id',
  authorize('admin', 'manager'),
  validate(updateSchema),
  vendorController.update
);

// DELETE /api/vendors/:id  (admin only)
router.delete('/:id', authorize('admin'), vendorController.remove);

module.exports = router;
