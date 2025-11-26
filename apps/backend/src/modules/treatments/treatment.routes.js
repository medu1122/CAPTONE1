import express from 'express';
import { initMockData, getStats, searchDiseases } from './treatment.controller.js';

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

/**
 * @route GET /api/v1/treatments/search-diseases
 * @desc Search disease names for autocomplete (supports fuzzy matching, no diacritics)
 * @access Public
 * @query {string} q - Search query
 */
router.get('/search-diseases', searchDiseases);

export default router;

