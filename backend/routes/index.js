const { Router } = require('express');
const authRoutes = require('./authRoutes');
const goodsRoutes = require('./goodsRoutes');
const locationRoutes = require('./locationRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/goods', goodsRoutes);
router.use('/locations', locationRoutes);

module.exports = router;
