import express from 'express';
import phoneVerificationController from './phoneVerification.controller.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// All routes require authentication
router.post('/create-otp', authMiddleware, rateLimitMiddleware, phoneVerificationController.createVerificationOTP);
router.post('/verify', authMiddleware, rateLimitMiddleware, phoneVerificationController.verifyPhone);
router.get('/status', authMiddleware, rateLimitMiddleware, phoneVerificationController.checkPhoneVerificationStatus);
router.post('/resend', authMiddleware, rateLimitMiddleware, phoneVerificationController.resendVerificationOTP);

export default router;

