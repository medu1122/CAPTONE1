import express from 'express';
import { authMiddleware } from '../../common/middleware/auth.js';
import * as passwordChangeOTPController from './passwordChangeOTP.controller.js';

const router = express.Router();

// Generate and send OTP for password change
router.post('/generate', authMiddleware, passwordChangeOTPController.generateOTP);

// Verify OTP for password change
router.post('/verify', authMiddleware, passwordChangeOTPController.verifyOTP);

export default router;

