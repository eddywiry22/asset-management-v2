const { Router } = require('express');
const authRoutes = require('./authRoutes');
const auditLogRoutes = require('./auditLogRoutes');

const router = Router();

// Mount domain routers here as the project grows:
// router.use('/assets', require('./assetRoutes'));
// router.use('/categories', require('./categoryRoutes'));

router.use('/auth', authRoutes);
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
