import express from 'express';
import { initMockData, getStats } from './treatment.controller.js';

const router = express.Router();

/**
 * @route POST /api/v1/treatments/init-mock
 * @desc Initialize mock data for testing
 * @access Public (for development)
 */
router.post('/init-mock', initMockData);

/**
 * @route GET /api/v1/treatments/stats
 * @desc Get treatment data statistics
 * @access Public
 */
router.get('/stats', getStats);

export default router;

