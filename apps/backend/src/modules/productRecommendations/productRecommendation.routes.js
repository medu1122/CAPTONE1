import express from 'express';
import { 
  getProductRecommendations,
  searchProductRecommendations,
  getProductRecommendationById,
  getProductsByCategoryController,
  createProductRecommendation
} from './productRecommendation.controller.js';
import { 
  validateRecommendationsQuery,
  validateSearchQuery,
  validateCreateProduct 
} from './productRecommendation.validation.js';
import { authMiddleware } from '../../common/middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/v1/products/recommendations
 * @desc Get product recommendations based on plant and disease
 * @access Public
 */
router.get('/recommendations', validateRecommendationsQuery, getProductRecommendations);

/**
 * @route GET /api/v1/products/search
 * @desc Search products by query
 * @access Public
 */
router.get('/search', validateSearchQuery, searchProductRecommendations);

/**
 * @route GET /api/v1/products/category/:category
 * @desc Get products by category
 * @access Public
 */
router.get('/category/:category', getProductsByCategoryController);

/**
 * @route GET /api/v1/products/:productId
 * @desc Get product by ID
 * @access Public
 */
router.get('/:productId', getProductRecommendationById);

/**
 * @route POST /api/v1/products
 * @desc Create new product recommendation
 * @access Private
 */
router.post('/', authMiddleware, validateCreateProduct, createProductRecommendation);

export default router;
