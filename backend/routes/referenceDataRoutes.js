const { Router } = require('express');
const Joi = require('joi');
const referenceDataController = require('../controllers/referenceDataController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');

const router = Router();

router.use(authenticate);

const stockQuerySchema = Joi.object({
  locationId: Joi.number().integer().positive().required(),
});

// GET /api/locations
router.get('/locations', referenceDataController.getLocations);

// GET /api/reference-data/goods (canonical)
router.get('/goods', referenceDataController.getGoods);

// GET /api/reference-data/items (legacy alias kept for backward compatibility)
router.get('/items', referenceDataController.getGoods);

// GET /api/stocks?locationId=X
router.get('/stocks', validate(stockQuerySchema, 'query'), referenceDataController.getStocks);

module.exports = router;
