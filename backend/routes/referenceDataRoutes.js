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

// GET /api/items
router.get('/items', referenceDataController.getItems);

// GET /api/stocks?locationId=X
router.get('/stocks', validate(stockQuerySchema, 'query'), referenceDataController.getStocks);

module.exports = router;
