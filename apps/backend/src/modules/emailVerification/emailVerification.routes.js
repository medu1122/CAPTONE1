import express from 'express';
import emailVerificationController from './emailVerification.controller.js';
import { 
  validateCreateVerificationToken,
  validateVerifyEmail,
  validateVerificationToken 
} from './emailVerification.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/create-token', rateLimitMiddleware, validateCreateVerificationToken, emailVerificationController.createVerificationToken);
router.post('/verify', rateLimitMiddleware, validateVerifyEmail, emailVerificationController.verifyEmail);
router.get('/verify/:verificationToken', rateLimitMiddleware, validateVerificationToken, emailVerificationController.verifyEmail);

// Protected routes
router.get('/status', authMiddleware, rateLimitMiddleware, emailVerificationController.checkVerificationStatus);
router.post('/resend', authMiddleware, rateLimitMiddleware, emailVerificationController.resendVerificationEmail);

export default router;
