const { Router } = require('express');
const Joi = require('joi');
const stockController = require('../controllers/stockController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

const querySchema = Joi.object({
  goods_id: Joi.number().integer().positive().optional(),
  location_id: Joi.number().integer().positive().optional(),
});

router.use(authenticate);

// GET /api/stocks
router.get('/', validate(querySchema, 'query'), stockController.getAll);

// GET /api/stocks/:id
router.get('/:id', stockController.getById);

module.exports = router;
