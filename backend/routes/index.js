const { Router } = require('express');
const authRoutes = require('./authRoutes');
const movementRequestRoutes = require('./movementRequestRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/movement-requests', movementRequestRoutes);

module.exports = router;
