import { processChatAnalyze } from './chatAnalyze.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Main Chat Analyze Controller
 * Handles all chat analyze requests with intelligent routing
 */

/**
 * Process chat analyze request
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const chatAnalyze = async (req, res) => {
  try {
    const { message, imageUrl, weather } = req.body;
    const userId = req.user?.id; // Optional authentication

    // Validate input
    if (!message && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either message or image is required',
      });
    }

    // Process the request
    const result = await processChatAnalyze({
      message,
      imageUrl,
      weather,
      userId,
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
 * Process text-only chat request
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const chatTextOnly = async (req, res) => {
  try {
    const { message, weather } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await processChatAnalyze({
      message,
      weather,
      userId,
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
 * Process image-only chat request
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const chatImageOnly = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user?.id;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    const result = await processChatAnalyze({
      imageUrl,
      userId,
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
 * Process image + text chat request
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const chatImageText = async (req, res) => {
  try {
    const { message, imageUrl, weather } = req.body;
    const userId = req.user?.id;

    if (!message || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Both message and image are required',
      });
    }

    const result = await processChatAnalyze({
      message,
      imageUrl,
      weather,
      userId,
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
 * Get chat analyze status
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getChatAnalyzeStatus = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'active',
        supportedTypes: ['text-only', 'image-only', 'image-text'],
        features: [
          'Plant identification',
          'Disease analysis',
          'Care recommendations',
          'Product suggestions',
          'Weather integration',
          'AI-powered responses'
        ],
        endpoints: {
          'POST /api/v1/chat-analyze': 'Main chat analyze endpoint',
          'POST /api/v1/chat-analyze/text': 'Text-only processing',
          'POST /api/v1/chat-analyze/image': 'Image-only processing',
          'POST /api/v1/chat-analyze/image-text': 'Image + text processing'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  chatAnalyze,
  chatTextOnly,
  chatImageOnly,
  chatImageText,
  getChatAnalyzeStatus,
};
