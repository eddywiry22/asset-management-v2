const { Router } = require('express');
const authRoutes = require('./authRoutes');
const goodsRoutes = require('./goodsRoutes');
const locationRoutes = require('./locationRoutes');
const categoryRoutes = require('./categoryRoutes');
const vendorRoutes = require('./vendorRoutes');
const stockRoutes = require('./stockRoutes');
const stockAdjustmentRoutes = require('./stockAdjustmentRoutes');
const movementRoutes = require('./movementRoutes');
const referenceDataRoutes = require('./referenceDataRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/goods', goodsRoutes);
router.use('/locations', locationRoutes);
router.use('/categories', categoryRoutes);
router.use('/vendors', vendorRoutes);
router.use('/stocks', stockRoutes);
router.use('/stock-adjustments', stockAdjustmentRoutes);
router.use('/movements', movementRoutes);
router.use('/reference-data', referenceDataRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
