const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getLogs, getModules } = require('../controllers/auditLogController');

const router = Router();

// All audit log routes require authentication and admin/manager role
router.use(authenticate, authorize('admin', 'manager'));

router.get('/', getLogs);
router.get('/modules', getModules);

module.exports = router;
