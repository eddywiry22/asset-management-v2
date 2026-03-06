const { Router } = require('express');
const Joi = require('joi');
const locationController = require('../controllers/locationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const createSchema = Joi.object({
  name: Joi.string().max(200).required(),
  code: Joi.string().max(50).required(),
  description: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  code: Joi.string().max(50).optional(),
  description: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const querySchema = Joi.object({
  isActive: Joi.boolean().optional(),
});

router.use(authenticate);

// GET /api/locations
router.get('/', validate(querySchema, 'query'), locationController.getAll);

// GET /api/locations/:id
router.get('/:id', locationController.getById);

// POST /api/locations  (admin, manager)
router.post('/', authorize('admin', 'manager'), validate(createSchema), locationController.create);

// PUT /api/locations/:id  (admin, manager)
router.put('/:id', authorize('admin', 'manager'), validate(updateSchema), locationController.update);

// DELETE /api/locations/:id  (admin – soft delete)
router.delete('/:id', authorize('admin'), locationController.remove);

module.exports = router;
