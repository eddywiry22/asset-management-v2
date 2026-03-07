const { Router } = require('express');
const authRoutes = require('./authRoutes');
const goodsRoutes = require('./goodsRoutes');
const locationRoutes = require('./locationRoutes');
const categoryRoutes = require('./categoryRoutes');
const vendorRoutes = require('./vendorRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/goods', goodsRoutes);
router.use('/locations', locationRoutes);
router.use('/categories', categoryRoutes);
router.use('/vendors', vendorRoutes);

module.exports = router;
