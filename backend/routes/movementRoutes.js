const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { list, create, approve, reject, getAuditLogs } = require('../controllers/movementController');

const router = Router();

// All movement routes require authentication
router.use(authenticate);

// Any authenticated user can list and create movement requests
router.get('/', list);
router.post('/', create);

// Only admin/manager can approve or reject
router.put('/:id/approve', authorize('admin', 'manager'), approve);
router.put('/:id/reject', authorize('admin', 'manager'), reject);

// Audit log for a movement (admin/manager only)
router.get('/:id/audit-logs', authorize('admin', 'manager'), getAuditLogs);

module.exports = router;
