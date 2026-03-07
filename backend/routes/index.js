const { Router } = require('express');
const authRoutes = require('./authRoutes');
const movementRoutes = require('./movementRoutes');
const referenceDataRoutes = require('./referenceDataRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/movements', movementRoutes);
router.use(referenceDataRoutes); // mounts /locations, /items, /stocks

module.exports = router;
