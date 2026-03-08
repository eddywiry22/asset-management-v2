const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getLogs, getModules } = require('../controllers/auditLogController');

const router = Router();

// All audit log routes require authentication and admin/warehouse_head role
router.use(authenticate, authorize('admin', 'warehouse_head'));

router.get('/', getLogs);
router.get('/modules', getModules);

module.exports = router;
