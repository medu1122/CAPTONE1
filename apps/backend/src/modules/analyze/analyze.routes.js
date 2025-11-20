import express from 'express';
import { authMiddleware } from '../../common/middleware/auth.js';
import { 
  analyzeImageController, 
  getHistoryController,
  getAnalysisByIdController 
} from './analyze.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/analyze/image
 * @desc    Analyze plant image (public endpoint, but saves if authenticated)
 * @access  Public
 */
router.post('/image', analyzeImageController);

/**
 * @route   GET /api/v1/analyze/history
 * @desc    Get user's analysis history
 * @access  Private
 */
router.get('/history', authMiddleware, getHistoryController);

/**
 * @route   GET /api/v1/analyze/:id
 * @desc    Get single analysis by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, getAnalysisByIdController);

export default router;
