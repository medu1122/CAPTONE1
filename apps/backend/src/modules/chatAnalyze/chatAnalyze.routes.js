import express from 'express';
import { 
  chatAnalyze,
  chatTextOnly,
  chatImageOnly,
  chatImageText,
  getChatAnalyzeStatus
} from './chatAnalyze.controller.js';
import { 
  validateChatAnalyze,
  validateTextOnly,
  validateImageOnly,
  validateImageText
} from './chatAnalyze.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';

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

export default router;
