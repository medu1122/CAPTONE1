import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import analyzeRoutes from './modules/analyze/analyze.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';  // ✅ NEW: Simple chat (no image)
import oldChatRoutes from './modules/chats/chat.routes.js';  // Keep old for backward compatibility
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
import treatmentRoutes from './modules/treatments/treatment.routes.js';
import imageUploadRoutes from './modules/imageUpload/imageUpload.routes.js';
import provinceRoutes from './modules/provinces/province.routes.js';
import complaintRoutes from './modules/complaints/complaint.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

const router = express.Router();

// Register routes from each module
router.use('/auth', authRoutes);
router.use('/analyze', analyzeRoutes);  // ✅ NEW: /api/v1/analyze/* (Image analysis only)
router.use('/image-upload', imageUploadRoutes);  // ✅ NEW: /api/v1/image-upload/upload
router.use('/health', healthRoutes);
// Chat routes - mount both simple chat and chat history
router.use('/chat', chatRoutes);  // ✅ /api/v1/chat/ask, /api/v1/chat/context
router.use('/chat', oldChatRoutes);  // ✅ /api/v1/chat/messages, /api/v1/chat/history, /api/v1/chat/sessions, etc.
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
router.use('/treatments', treatmentRoutes);  // NEW
router.use('/provinces', provinceRoutes);  // NEW
router.use('/complaints', complaintRoutes);  // NEW: Complaints system
router.use('/reports', reportRoutes);  // NEW: Reports system
router.use('/admin', adminRoutes);  // NEW: Admin dashboard APIs
router.use('/notifications', notificationRoutes);  // NEW: Notifications system

export default router;