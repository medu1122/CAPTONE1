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
 * @param {string} params.sessionId - Session ID (optional, for chat history)
 * @param {object} params.context - Optional context (lastAnalysis, etc.)
 * @returns {Promise<object>} AI response
 */
export const chat = async ({ message, userId = null, sessionId = null, context = null }) => {
  try {
    console.log('💬 [chat] Processing message:', { 
      message: message.substring(0, 50), 
      userId: userId || 'null', 
      sessionId: sessionId || 'none',
      hasSessionId: !!sessionId,
      hasContext: !!context 
    });

    // 1. Load chat history for context (if sessionId is provided)
    let chatHistoryMessages = [];
    let contextPrompt = '';
    if (sessionId) {
      try {
        const { loadChatContextWithAnalysis, buildContextPromptFromHistory } = 
          await import('../chats/chat.service.js');
        
        const chatContext = await loadChatContextWithAnalysis({
          sessionId,
          userId,
          limit: 10  // Last 10 messages for context
        });
        
        if (chatContext && chatContext.messages && chatContext.messages.length > 0) {
          chatHistoryMessages = chatContext.messages;
          
          // Build context prompt from history
          contextPrompt = buildContextPromptFromHistory({
            messages: chatContext.messages,
            session: chatContext.session
          });
          
          console.log('📚 [chat] Loaded chat history:', {
            messageCount: chatHistoryMessages.length,
            hasContextPrompt: !!contextPrompt
          });
        }
      } catch (error) {
        console.warn('⚠️ [chat] Failed to load chat history:', error.message);
        // Continue without history
      }
    }

    // 2. Get weather context (optional)
    let weatherContext = null;
    try {
      weatherContext = await getWeatherData({ cityName: 'Hanoi' });
    } catch (error) {
      console.warn('Failed to get weather context:', error.message);
    }

    // 3. Build messages array with chat history
    const messages = [];
    
    // Add context prompt from history if available
    if (contextPrompt) {
      messages.push({
        role: 'system',
        content: contextPrompt
      });
    }
    
    // Add recent chat history messages (last 5 for context)
    const recentHistory = chatHistoryMessages.slice(-5);
    for (const histMsg of recentHistory) {
      messages.push({
        role: histMsg.role,
        content: histMsg.message
      });
    }
    
    // Add current user message
    messages.push({ role: 'user', content: message });

    console.log('💬 [chat] Sending to GPT:', {
      totalMessages: messages.length,
      historyMessages: recentHistory.length,
      hasContextPrompt: !!contextPrompt,
      hasWeather: !!weatherContext,
      hasAnalysis: !!context?.lastAnalysis
    });

    // 4. Generate AI response with context
    // ⚠️ IMPORTANT: Chatbot is for knowledge Q&A only, NOT image analysis
    // We explicitly set analysis to null to use Knowledge Question Mode
    const aiResponse = await generateAIResponse({
      messages,
      weather: weatherContext,
      analysis: null,  // ✅ Always null for chatbot - use Knowledge Question Mode
      products: null  // No products in simple chat
    });

    console.log('✅ [chat] Response generated');

    // Extract message string from response object
    const messageText = aiResponse.data?.message || aiResponse.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

    return {
      answer: messageText,
      context: {
        weather: weatherContext,
        analysis: context?.lastAnalysis || null,
        hasHistory: chatHistoryMessages.length > 0
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

