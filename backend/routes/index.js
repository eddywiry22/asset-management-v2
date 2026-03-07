const { Router } = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
