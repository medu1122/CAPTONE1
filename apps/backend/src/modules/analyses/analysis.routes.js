import express from 'express';
import {
  getMyPlants,
  getAnalysis,
  deleteAnalysisById,
} from './analysis.controller.js';
import {
  validateGetMyPlants,
  validateGetAnalysis,
  validateDeleteAnalysis,
} from './analysis.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/v1/analyses/my-plants
 * @desc Get all analyses for current user (My Plants)
 * @access Private
 */
router.get(
  '/my-plants',
  authMiddleware,
  validateGetMyPlants,
  getMyPlants
);

/**
 * @route GET /api/v1/analyses/:id
 * @desc Get analysis by ID
 * @access Private
 */
router.get('/:id', authMiddleware, validateGetAnalysis, getAnalysis);

/**
 * @route DELETE /api/v1/analyses/:id
 * @desc Delete analysis by ID
 * @access Private
 */
router.delete(
  '/:id',
  authMiddleware,
  validateDeleteAnalysis,
  deleteAnalysisById
);

export default router;

