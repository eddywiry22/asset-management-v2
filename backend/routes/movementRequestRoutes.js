const { Router } = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  getNotificationCount,
  getAll,
  create,
  updateStatus,
} = require('../controllers/movementRequestController');

const router = Router();

// All movement request routes require authentication
router.use(authenticate);

// GET /api/movement-requests/notifications/count
router.get('/notifications/count', getNotificationCount);

// GET /api/movement-requests
router.get('/', getAll);

// POST /api/movement-requests
router.post('/', create);

// PATCH /api/movement-requests/:id/status
router.patch('/:id/status', updateStatus);

module.exports = router;
