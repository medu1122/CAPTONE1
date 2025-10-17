import { 
  getRecommendations, 
  searchProducts, 
  getProductById, 
  getProductsByCategory,
  createProduct 
} from './productRecommendation.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get product recommendations
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getProductRecommendations = async (req, res) => {
  try {
    const { plant, disease, category, limit } = req.query;

    const result = await getRecommendations({
      plant,
      disease,
      category,
      limit: limit ? parseInt(limit) : 10,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Search products
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const searchProductRecommendations = async (req, res) => {
  try {
    const { q, category, page, limit } = req.query;

    const result = await searchProducts({
      q,
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get product by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getProductRecommendationById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await getProductById({ productId });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get products by category
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getProductsByCategoryController = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit } = req.query;

    const result = await getProductsByCategory({
      category,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Create new product recommendation
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const createProductRecommendation = async (req, res) => {
  try {
    const productData = req.body;
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const product = await createProduct({
      productData,
      userId,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  getProductRecommendations,
  searchProductRecommendations,
  getProductRecommendationById,
  getProductsByCategoryController,
  createProductRecommendation,
};
