import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import analyzeRoutes from './modules/analyze/analyze.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import chatRoutes from './modules/chats/chat.routes.js';
import emailVerificationRoutes from './modules/emailVerification/emailVerification.routes.js';
import passwordResetRoutes from './modules/passwordReset/passwordReset.routes.js';
import chatSessionRoutes from './modules/chatSessions/chatSession.routes.js';

const router = express.Router();

// Register routes from each module
router.use('/auth', authRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/health', healthRoutes);
router.use('/chat', chatRoutes);
router.use('/email-verification', emailVerificationRoutes);
router.use('/password-reset', passwordResetRoutes);
router.use('/chat-sessions', chatSessionRoutes);

export default router;