import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import analyzeRoutes from './modules/analyze/analyze.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import chatRoutes from './modules/chats/chat.routes.js';
import emailVerificationRoutes from './modules/emailVerification/emailVerification.routes.js';
import passwordResetRoutes from './modules/passwordReset/passwordReset.routes.js';
import chatSessionRoutes from './modules/chatSessions/chatSession.routes.js';
import weatherRoutes from './modules/weather/weather.routes.js';
import productRecommendationRoutes from './modules/productRecommendations/productRecommendation.routes.js';
import aiAssistantRoutes from './modules/aiAssistant/ai.routes.js';
import chatAnalyzeRoutes from './modules/chatAnalyze/chatAnalyze.routes.js';
import plantRoutes from './modules/plants/plant.routes.js';
import postRoutes from './modules/posts/post.routes.js';
import analysisRoutes from './modules/analyses/analysis.routes.js';
import plantBoxRoutes from './modules/plantBoxes/plantBox.routes.js';

const router = express.Router();

// Register routes from each module
router.use('/auth', authRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/health', healthRoutes);
router.use('/chat', chatRoutes);
router.use('/email-verification', emailVerificationRoutes);
router.use('/password-reset', passwordResetRoutes);
router.use('/chat-sessions', chatSessionRoutes);
router.use('/weather', weatherRoutes);
router.use('/products', productRecommendationRoutes);
router.use('/ai', aiAssistantRoutes);
router.use('/chat-analyze', chatAnalyzeRoutes);
router.use('/plants', plantRoutes);
router.use('/posts', postRoutes);
router.use('/analyses', analysisRoutes);
router.use('/plant-boxes', plantBoxRoutes);

export default router;