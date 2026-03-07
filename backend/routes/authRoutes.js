const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth, checkPermission } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// POST /api/auth/login  – public
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/profile – protected; requires a valid token + dashboard view permission
router.get('/profile', requireAuth, checkPermission('dashboard', 'view'), authController.getProfile);

module.exports = router;
