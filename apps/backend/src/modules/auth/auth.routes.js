import express from 'express';
import authController from './auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateLogout,
  validateVerifyEmail,
  validateResendVerification,
  validateUpdateProfile,
  validateChangePassword
} from './auth.validation.js';
import { authMiddleware, authOptional } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';
import { uploadImage } from '../../common/middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', rateLimitMiddleware, validateRegister, authController.register);
router.post('/login', rateLimitMiddleware, validateLogin, authController.login);
router.post('/refresh', rateLimitMiddleware, validateRefreshToken, authController.refresh);

// Email verification routes
router.get('/verify-email', rateLimitMiddleware, validateVerifyEmail, authController.verifyEmail);
router.post('/verify-email/resend', rateLimitMiddleware, validateResendVerification, authController.resendVerificationEmail);

// Public profile route (optional auth for privacy checks) - must be before /profile
router.get('/users/:userId', authOptional, authController.getPublicProfile);

// Protected routes
router.post('/logout', authMiddleware, validateLogout, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateUpdateProfile, authController.updateProfile);
router.post('/profile/upload-image', authMiddleware, uploadImage.single('image'), authController.uploadProfileImage);
router.post('/profile/change-password', authMiddleware, validateChangePassword, authController.changePassword);

export default router;