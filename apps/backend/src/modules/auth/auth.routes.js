import express from 'express';
import authController from './auth.controller.js';
import { validateRegister, validateLogin } from './auth.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', rateLimitMiddleware, validateLogin, authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

export default router;