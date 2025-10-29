import express from 'express';
import { 
  chatAnalyze,
  chatTextOnly,
  chatImageOnly,
  chatImageText,
  getChatAnalyzeStatus
} from './chatAnalyze.controller.js';
import { streamChatAnalyze } from './chatAnalyze.stream.controller.js';
import { 
  validateChatAnalyze,
  validateTextOnly,
  validateImageOnly,
  validateImageText
} from './chatAnalyze.validation.js';
import { authMiddleware, authOptional } from '../../common/middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/v1/chat-analyze
 * @desc Main chat analyze endpoint - handles all interaction types
 * @access Public
 */
router.post('/', validateChatAnalyze, chatAnalyze);

/**
 * @route POST /api/v1/chat-analyze/text
 * @desc Process text-only chat requests
 * @access Public
 */
router.post('/text', validateTextOnly, chatTextOnly);

/**
 * @route POST /api/v1/chat-analyze/image
 * @desc Process image-only chat requests
 * @access Public
 */
router.post('/image', validateImageOnly, chatImageOnly);

/**
 * @route POST /api/v1/chat-analyze/image-text
 * @desc Process image + text chat requests
 * @access Public
 */
router.post('/image-text', validateImageText, chatImageText);

/**
 * @route GET /api/v1/chat-analyze/status
 * @desc Get chat analyze system status
 * @access Public
 */
router.get('/status', getChatAnalyzeStatus);

/**
 * @route POST /api/v1/chat-analyze/stream
 * @desc Streaming chat analyze with SSE (Server-Sent Events)
 * @access Public - supports guest users
 */
router.post('/stream', authOptional, streamChatAnalyze);

export default router;
