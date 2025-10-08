import express from 'express';
import chatSessionController from './chatSession.controller.js';
import { 
  validateCreateSession,
  validateGetSessions,
  validateSessionId,
  validateUpdateTitle,
  validateUpdateMeta 
} from './chatSession.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';
import { rateLimitMiddleware } from '../../common/middleware/rateLimit.js';

const router = express.Router();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/chat-sessions
 * @desc Create a new chat session
 * @access Private (requires auth)
 */
router.post('/', validateCreateSession, chatSessionController.createSession);

/**
 * @route GET /api/chat-sessions
 * @desc Get user sessions with pagination
 * @access Private (requires auth)
 */
router.get('/', validateGetSessions, chatSessionController.getUserSessions);

/**
 * @route GET /api/chat-sessions/:sessionId
 * @desc Get session by ID
 * @access Private (requires auth)
 */
router.get('/:sessionId', validateSessionId, chatSessionController.getSessionById);

/**
 * @route PUT /api/chat-sessions/:sessionId/title
 * @desc Update session title
 * @access Private (requires auth)
 */
router.put('/:sessionId/title', validateSessionId, validateUpdateTitle, chatSessionController.updateSessionTitle);

/**
 * @route PUT /api/chat-sessions/:sessionId/meta
 * @desc Update session metadata
 * @access Private (requires auth)
 */
router.put('/:sessionId/meta', validateSessionId, validateUpdateMeta, chatSessionController.updateSessionMeta);

/**
 * @route DELETE /api/chat-sessions/:sessionId
 * @desc Delete session and all messages
 * @access Private (requires auth)
 */
router.delete('/:sessionId', validateSessionId, chatSessionController.deleteSession);

export default router;
