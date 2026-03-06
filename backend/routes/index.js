const { Router } = require('express');
const authRoutes = require('./authRoutes');
const locationRoutes = require('./locationRoutes');

const router = Router();

// Mount domain routers here as the project grows:
// router.use('/assets', require('./assetRoutes'));
// router.use('/categories', require('./categoryRoutes'));

router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
