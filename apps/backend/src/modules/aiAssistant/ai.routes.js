import express from 'express';
import { generateResponse, analyzeImageNeed, analyzeProductNeed } from './ai.controller.js';
import { 
  validateGenerateResponse, 
  validateAnalyzeImageNeed, 
  validateAnalyzeProductNeed 
} from './ai.validation.js';

const router = express.Router();

/**
 * @route POST /api/v1/ai/respond
 * @desc Generate AI response for chat
 * @access Public
 */
router.post('/respond', validateGenerateResponse, generateResponse);

/**
 * @route POST /api/v1/ai/analyze-image-need
 * @desc Check if image analysis is needed
 * @access Public
 */
router.post('/analyze-image-need', validateAnalyzeImageNeed, analyzeImageNeed);

/**
 * @route POST /api/v1/ai/analyze-product-need
 * @desc Check if product recommendations are needed
 * @access Public
 */
router.post('/analyze-product-need', validateAnalyzeProductNeed, analyzeProductNeed);

export default router;
