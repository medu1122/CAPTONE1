import express from 'express';
import { authMiddleware } from '../../common/middleware/auth.js';
import { askController, getContextController } from './chat.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/chat/ask
 * @desc    Ask a question (text-only, no image)
 * @access  Public (but uses lastAnalysis if authenticated)
 */
router.post('/ask', askController);

/**
 * @route   GET /api/v1/chat/context
 * @desc    Get user's current chat context (last analysis)
 * @access  Private
 */
router.get('/context', authMiddleware, getContextController);

export default router;

