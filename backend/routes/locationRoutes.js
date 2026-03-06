const { Router } = require('express');
const Joi = require('joi');
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().min(1).max(150).required(),
  address: Joi.string().min(1).required(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(150),
  address: Joi.string().min(1),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
}).min(1);

const querySchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});

const idSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// All location routes require authentication
router.use(authenticate);

// GET /api/locations
router.get('/', validate(querySchema, 'query'), locationController.getAll);

// GET /api/locations/:id
router.get('/:id', validate(idSchema, 'params'), locationController.getById);

// GET /api/locations/:id/logs
router.get('/:id/logs', validate(idSchema, 'params'), locationController.getLogs);

// POST /api/locations  (admin & manager only)
router.post('/', authorize('admin', 'manager'), validate(createSchema), locationController.create);

// PATCH /api/locations/:id  (admin & manager only)
router.patch(
  '/:id',
  authorize('admin', 'manager'),
  validate(idSchema, 'params'),
  validate(updateSchema),
  locationController.update
);

// DELETE /api/locations/:id  (admin only)
router.delete('/:id', authorize('admin'), validate(idSchema, 'params'), locationController.remove);

module.exports = router;
