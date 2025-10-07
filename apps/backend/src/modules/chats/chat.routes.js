import express from 'express';
import chatController from './chat.controller.js';
import { 
  validateStartSession,
  validateSendMessage,
  validateGetHistory,
  validateListSessions,
  validateSessionId,
  validateMessageId 
} from './chat.validation.js';
import { authOptional } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Apply middleware to all routes
router.use(authOptional);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/chat/sessions/start
 * @desc Start a new chat session
 * @access Public (optional auth)
 */
router.post('/sessions/start', validateStartSession, chatController.startSession);

/**
 * @route POST /api/chat/messages
 * @desc Send a message to a chat session
 * @access Public (optional auth)
 */
router.post('/messages', validateSendMessage, chatController.sendMessage);

/**
 * @route GET /api/chat/history
 * @desc Get chat history for a session
 * @access Public (optional auth)
 */
router.get('/history', validateGetHistory, chatController.getHistory);

/**
 * @route GET /api/chat/sessions
 * @desc List chat sessions for the current user
 * @access Public (optional auth)
 */
router.get('/sessions', validateListSessions, chatController.listSessions);

/**
 * @route DELETE /api/chat/sessions/:sessionId
 * @desc Delete a chat session
 * @access Public (optional auth)
 */
router.delete('/sessions/:sessionId', validateSessionId, chatController.deleteSession);

/**
 * @route DELETE /api/chat/messages/:messageId
 * @desc Delete a specific message
 * @access Public (optional auth)
 */
router.delete('/messages/:messageId', validateMessageId, chatController.deleteMessage);

export default router;
