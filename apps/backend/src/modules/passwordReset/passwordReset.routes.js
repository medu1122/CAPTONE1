import express from 'express';
import passwordResetController from './passwordReset.controller.js';
import { 
  validateRequestPasswordReset,
  validateResetToken,
  validateResetPassword 
} from './passwordReset.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Public routes
router.post('/request', rateLimitMiddleware, validateRequestPasswordReset, passwordResetController.requestPasswordReset);
router.post('/validate-token', rateLimitMiddleware, validateResetToken, passwordResetController.validateResetToken);
router.post('/reset', rateLimitMiddleware, validateResetPassword, passwordResetController.resetPassword);

// Protected routes
router.get('/pending-resets', authMiddleware, rateLimitMiddleware, passwordResetController.checkPendingResets);

export default router;
