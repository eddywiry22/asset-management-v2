const { Router } = require('express');
const authRoutes = require('./authRoutes');
const goodsRoutes = require('./goodsRoutes');
const locationRoutes = require('./locationRoutes');
const stockRoutes = require('./stockRoutes');
const stockAdjustmentRoutes = require('./stockAdjustmentRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/goods', goodsRoutes);
router.use('/locations', locationRoutes);
router.use('/stocks', stockRoutes);
router.use('/stock-adjustments', stockAdjustmentRoutes);

module.exports = router;
