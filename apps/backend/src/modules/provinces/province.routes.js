import express from 'express';
import { getProvinces, getProvinceInfoController, getProvinceRecommendationController } from './province.controller.js';

const router = express.Router();

/**
 * @route GET /api/v1/provinces
 * @desc Get all provinces
 * @access Public
 */
router.get('/', getProvinces);

/**
 * @route GET /api/v1/provinces/:code/info
 * @desc Get province information
 * @access Public
 */
router.get('/:code/info', getProvinceInfoController);

/**
 * @route GET /api/v1/provinces/:code/recommendation
 * @desc Get AI recommendation for crop planting in current season
 * @access Public
 */
router.get('/:code/recommendation', getProvinceRecommendationController);

export default router;

