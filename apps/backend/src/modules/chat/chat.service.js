import { generateAIResponse } from '../aiAssistant/ai.service.js';
import { getWeatherData } from '../weather/weather.service.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Simple Chat Service (No Image Analysis)
 * For Knowledge Page - Q&A chatbot
 */

/**
 * Process chat message (text-only, no image)
 * @param {object} params - Parameters
 * @param {string} params.message - User message
 * @param {string} params.userId - User ID (optional)
 * @param {object} params.context - Optional context (lastAnalysis, etc.)
 * @returns {Promise<object>} AI response
 */
export const chat = async ({ message, userId = null, context = null }) => {
  try {
    console.log('💬 [chat] Processing message:', { message: message.substring(0, 50), userId, hasContext: !!context });

    // 1. Get weather context (optional)
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 2. Build messages array
    const messages = [
      { role: 'user', content: message }
    ];

    // 3. Generate AI response with context
    const aiResponse = await generateAIResponse({
      messages,
      weather: weatherContext,
      analysis: context?.lastAnalysis || null,
      products: null  // No products in simple chat
    });

    console.log('✅ [chat] Response generated');

    return {
      answer: aiResponse,
      context: {
        weather: weatherContext,
        analysis: context?.lastAnalysis || null
      }
    };

  } catch (error) {
    console.error('❌ [chat] Error:', error);
    throw httpError(error.statusCode || 500, error.message || 'Chat failed');
  }
};

/**
 * Load user's last analysis for context
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Last analysis or null
 */
export const loadLastAnalysis = async (userId) => {
  try {
    const { default: Analysis } = await import('../analyses/analysis.model.js');
    
    const lastAnalysis = await Analysis.findOne({ userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();
    
    if (!lastAnalysis) {
      return null;
    }

    // Return simplified analysis for context
    return {
      plant: lastAnalysis.resultTop?.plant || null,
      disease: lastAnalysis.resultTop?.disease || null,
      confidence: lastAnalysis.resultTop?.confidence || 0,
      isHealthy: lastAnalysis.resultTop?.isHealthy || false,
      analyzedAt: lastAnalysis.createdAt
    };

  } catch (error) {
    console.error('Failed to load last analysis:', error);
    return null;
  }
};

