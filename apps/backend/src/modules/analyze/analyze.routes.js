import express from 'express';
import { authMiddleware } from '../../common/middleware/auth.js';
import { 
  analyzeImageController, 
  getHistoryController,
  getAnalysisByIdController 
} from './analyze.controller.js';
import { validateImageController } from './analyze.validation.controller.js';
import { streamImageAnalysisController } from './analyze.stream.controller.js';
import { getDiseaseExplanationController } from './analyze.explanation.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/analyze/validate-image
 * @desc    Quick validation to check if image contains a plant
 * @access  Public
 */
router.post('/validate-image', validateImageController);

/**
 * @route   GET /api/v1/analyze/disease-explanation
 * @desc    Get GPT explanation for a disease (short, for tooltips)
 * @access  Public
 */
router.get('/disease-explanation', getDiseaseExplanationController);

/**
 * @route   POST /api/v1/analyze/image-stream
 * @desc    Analyze plant image with streaming (SSE) - Real-time progress updates
 * @access  Public (but saves if authenticated)
 */
router.post('/image-stream', streamImageAnalysisController);

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
