import express from 'express';
import authController from './auth.controller.js';
import { 
  validateRegister, 
  validateLogin, 
  validateRefreshToken, 
  validateLogout 
} from './auth.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/register', rateLimitMiddleware, validateRegister, authController.register);
router.post('/login', rateLimitMiddleware, validateLogin, authController.login);
router.post('/refresh', rateLimitMiddleware, validateRefreshToken, authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, validateLogout, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.get('/profile', authMiddleware, authController.getProfile);

export default router;