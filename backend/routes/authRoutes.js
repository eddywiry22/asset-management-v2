const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
