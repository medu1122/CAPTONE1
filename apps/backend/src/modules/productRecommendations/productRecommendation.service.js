import ProductRecommendation from './productRecommendation.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Get product recommendations based on plant and disease
 * @param {object} params - Parameters
 * @param {string} params.plant - Plant name
 * @param {string} params.disease - Disease name (optional)
 * @param {string} params.category - Product category (optional)
 * @param {number} params.limit - Number of results (default: 10)
 * @returns {Promise<object>} Product recommendations
 */
export const getRecommendations = async ({ 
  plant, 
  disease = null, 
  category = null, 
  limit = 10 
}) => {
  try {
    if (!plant) {
      throw httpError(400, 'Plant name is required');
    }

    // Build query
    const query = { isActive: true };
    
    // Add plant type filter
    const plantLower = plant.toLowerCase();
    query.$or = [
      { plantTypes: { $in: [plantLower] } },
      { tags: { $in: [plantLower] } },
      { name: { $regex: plantLower, $options: 'i' } },
    ];

    // Add disease filter if provided
    if (disease) {
      const diseaseLower = disease.toLowerCase();
      query.$and = [
        {
          $or: [
            { diseaseTypes: { $in: [diseaseLower] } },
            { tags: { $in: [diseaseLower] } },
            { name: { $regex: diseaseLower, $options: 'i' } },
          ]
        }
      ];
    }

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Get recommendations with sorting
    const recommendations = await ProductRecommendation.find(query)
      .sort({ 
        'rating.average': -1, 
        'rating.count': -1,
        price: 1 
      })
      .limit(limit)
      .lean();

    return {
      plant,
      disease,
      category,
      recommendations,
      total: recommendations.length,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get recommendations: ${error.message}`);
  }
};

/**
 * Search products by query
 * @param {object} params - Parameters
 * @param {string} params.q - Search query
 * @param {string} params.category - Product category (optional)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @returns {Promise<object>} Search results with pagination
 */
export const searchProducts = async ({ 
  q, 
  category = null, 
  page = 1, 
  limit = 20 
}) => {
  try {
    if (!q || q.trim().length < 2) {
      throw httpError(400, 'Search query must be at least 2 characters');
    }

    const skip = (page - 1) * limit;
    const query = { 
      isActive: true,
      $text: { $search: q.trim() }
    };

    if (category) {
      query.category = category;
    }

    const [products, total] = await Promise.all([
      ProductRecommendation.find(query)
        .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductRecommendation.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Product search failed: ${error.message}`);
  }
};

/**
 * Get product by ID
 * @param {object} params - Parameters
 * @param {string} params.productId - Product ID
 * @returns {Promise<object>} Product details
 */
export const getProductById = async ({ productId }) => {
  try {
    if (!productId) {
      throw httpError(400, 'Product ID is required');
    }

    const product = await ProductRecommendation.findOne({ 
      _id: productId, 
      isActive: true 
    }).lean();

    if (!product) {
      throw httpError(404, 'Product not found');
    }

    return product;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get product: ${error.message}`);
  }
};

/**
 * Get products by category
 * @param {object} params - Parameters
 * @param {string} params.category - Product category
 * @param {number} params.limit - Number of results (default: 20)
 * @returns {Promise<object>} Products by category
 */
export const getProductsByCategory = async ({ category, limit = 20 }) => {
  try {
    if (!category) {
      throw httpError(400, 'Category is required');
    }

    const products = await ProductRecommendation.find({
      category,
      isActive: true,
    })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit)
      .lean();

    return {
      category,
      products,
      total: products.length,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to get products by category: ${error.message}`);
  }
};

/**
 * Create a new product recommendation
 * @param {object} params - Parameters
 * @param {object} params.productData - Product data
 * @param {string} params.userId - User ID
 * @returns {Promise<object>} Created product
 */
export const createProduct = async ({ productData, userId }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const product = new ProductRecommendation({
      ...productData,
      createdBy: userId,
    });

    const savedProduct = await product.save();
    return savedProduct;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw httpError(400, error.message);
    }
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to create product: ${error.message}`);
  }
};

export default {
  getRecommendations,
  searchProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
};
