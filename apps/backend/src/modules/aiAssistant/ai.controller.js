import { generateAIResponse, needsImageAnalysis, needsProductRecommendations } from './ai.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Generate AI response for chat
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const generateResponse = async (req, res) => {
  try {
    const { messages, weather, analysis, products } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw httpError(400, 'Messages array is required');
    }

    // Validate messages format
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw httpError(400, 'Each message must have role and content');
      }
      if (!['user', 'assistant'].includes(message.role)) {
        throw httpError(400, 'Message role must be user or assistant');
      }
    }

    const response = await generateAIResponse({
      messages,
      weather,
      analysis,
      products,
    });

    res.json(response);
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
 * Analyze if image processing is needed
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const analyzeImageNeed = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw httpError(400, 'Messages array is required');
    }

    const needsAnalysis = needsImageAnalysis(messages);

    res.json({
      success: true,
      data: {
        needsImageAnalysis: needsAnalysis,
        reason: needsAnalysis ? 'Message contains image-related keywords' : 'No image analysis needed',
      },
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
 * Analyze if product recommendations are needed
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const analyzeProductNeed = async (req, res) => {
  try {
    const { messages, analysis } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw httpError(400, 'Messages array is required');
    }

    const needsProducts = needsProductRecommendations(messages, analysis);

    res.json({
      success: true,
      data: {
        needsProductRecommendations: needsProducts,
        reason: needsProducts ? 'Message contains product-related keywords or analysis available' : 'No product recommendations needed',
      },
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
  generateResponse,
  analyzeImageNeed,
  analyzeProductNeed,
};
