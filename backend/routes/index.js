const { Router } = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const vendorRoutes = require('./vendorRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/vendors', vendorRoutes);
// router.use('/assets', require('./assetRoutes'));

module.exports = router;
