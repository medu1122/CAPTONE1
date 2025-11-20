import { chat, loadLastAnalysis } from './chat.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Chat Controller - Simple Q&A (No Image)
 */

/**
 * POST /api/v1/chat/ask
 * Ask a question (text-only)
 */
export const askController = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || null;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw httpError(400, 'message is required');
    }

    console.log('💬 [askController] Request:', { message: message.substring(0, 50), userId });

    // Load last analysis for context (if user is logged in)
    let context = null;
    if (userId) {
      const lastAnalysis = await loadLastAnalysis(userId);
      if (lastAnalysis) {
        context = { lastAnalysis };
        console.log('📊 [askController] Loaded last analysis:', {
          plant: lastAnalysis.plant?.commonName,
          disease: lastAnalysis.disease?.name
        });
      }
    }

    const result = await chat({ message, userId, context });

    res.json({
      success: true,
      data: {
        answer: result.answer,
        context: result.context
      }
    });

  } catch (error) {
    console.error('❌ [askController] Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/chat/context
 * Get user's current context (last analysis)
 */
export const getContextController = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw httpError(401, 'Authentication required');
    }

    const lastAnalysis = await loadLastAnalysis(userId);

    res.json({
      success: true,
      data: {
        lastAnalysis
      }
    });

  } catch (error) {
    console.error('❌ [getContextController] Error:', error);
    next(error);
  }
};

