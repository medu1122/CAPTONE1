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
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw httpError(400, 'message is required');
    }

    console.log('💬 [askController] Request:', { 
      message: message.substring(0, 50), 
      userId: userId || 'null',
      sessionId: sessionId || 'none',
      hasSessionId: !!sessionId
    });

    // ⚠️ NOTE: Chatbot is for knowledge Q&A only, NOT image analysis
    // We don't load lastAnalysis because chatbot should always use Knowledge Question Mode
    // If user wants to discuss their analyzed image, they should use PlantAnalysisPage
    let context = null;
    // Removed lastAnalysis loading - chatbot is text-only Q&A

    const result = await chat({ message, userId, sessionId, context });

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

