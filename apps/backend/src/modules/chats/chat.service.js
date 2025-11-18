import crypto from 'crypto';
import mongoose from 'mongoose';
import ChatMessage from './chat.model.js';
import ChatSession from '../chatSessions/chatSession.model.js';
import { CHAT_ROLES, CHAT_LIMITS, CHAT_ERRORS } from './chat.constants.js';
import { httpError } from '../../common/utils/http.js';
import { getPlantCareInfo } from '../plants/plant.service.js';

/**
 * Create a new chat session
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {object} params.options - Session options
 * @returns {Promise<object>} Session creation result
 */
export const createSession = async ({ userId, options = {} }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const sessionId = crypto.randomUUID();
    
    // Create session record
    const session = await ChatSession.create({
      sessionId,
      user: userId,
      title: options.title || null,
      meta: options.meta || {},
    });

    return {
      sessionId: session.sessionId,
      title: session.title,
      createdAt: session.createdAt,
      meta: session.meta,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to create session');
  }
};

/**
 * Append a message to a chat session
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (required)
 * @param {string} params.role - Message role
 * @param {string} params.message - Message content
 * @param {Array} params.attachments - File attachments (optional)
 * @param {object} params.related - Related resources (optional)
 * @param {object} params.meta - Additional metadata (optional)
 * @returns {Promise<object>} Created message
 */
export const appendMessage = async ({ 
  sessionId, 
  userId, 
  role, 
  message, 
  attachments = [], 
  related = null, 
  meta = {} 
}) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const chatMessage = new ChatMessage({
      sessionId,
      user: userId,
      role,
      message,
      attachments,
      related,
      meta,
    });

    const savedMessage = await chatMessage.save();
    
    // Update session statistics
    await updateSessionStats(sessionId);
    
    return savedMessage;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw httpError(400, error.message);
    }
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to save message');
  }
};

/**
 * Update session statistics
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export const updateSessionStats = async (sessionId) => {
  try {
    // Count messages for this session
    const messagesCount = await ChatMessage.countDocuments({ sessionId });

    // Get the last message timestamp
    const lastMessage = await ChatMessage.findOne({ sessionId })
      .sort({ createdAt: -1 })
      .select('createdAt');

    // Update session statistics
    await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        messagesCount,
        lastMessageAt: lastMessage ? lastMessage.createdAt : new Date(),
      }
    );
  } catch (error) {
    // Don't throw error for stats update, just log it
    console.error('Failed to update session stats:', error);
  }
};

/**
 * List chat sessions for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (required)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<object>} Sessions list with pagination
 */
export const listSessions = async ({ userId, page = CHAT_LIMITS.PAGINATION.DEFAULT_PAGE, limit = CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT }) => {
  try {
    const skip = (page - 1) * limit;
    
    console.log('🔍 [listSessions Service] Query:', {
      userId,
      userIdType: typeof userId,
      page,
      limit,
      skip
    });
    
    // Get sessions from ChatSession collection - support guest users
    const [sessions, total] = await Promise.all([
      ChatSession.find({ user: userId })  // ✅ Can be null for guest users
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments({ user: userId }),
    ]);

    console.log('🔍 [listSessions Service] Found:', {
      sessionsCount: sessions.length,
      total,
      firstSessionUser: sessions[0]?.user
    });

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('❌ [listSessions Service] Error:', error);
    throw httpError(500, 'Failed to list sessions');
  }
};

/**
 * Get chat history for a session
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (required)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.q - Search query (optional)
 * @param {Date} params.from - Start date (optional)
 * @param {Date} params.to - End date (optional)
 * @returns {Promise<object>} Chat history with pagination
 */
export const getHistory = async ({ 
  sessionId, 
  userId, 
  page = CHAT_LIMITS.PAGINATION.DEFAULT_PAGE, 
  limit = CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT,
  q = null,
  from = null,
  to = null 
}) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build query - support guest users (userId = null)
    const query = { 
      sessionId,
      user: userId  // ✅ Can be null for guest users
    };
    
    // Add search filter
    if (q && q.trim()) {
      query.$text = { $search: q.trim() };
    }
    
    // Add date range filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const [messages, total] = await Promise.all([
      ChatMessage.find(query)
        .populate({
          path: 'analysis',
          select: 'inputImages resultTop source createdAt'
        })
        .sort({ createdAt: 1 }) // Chronological order
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments(query),
    ]);

    // Debug: Log populated data
    console.log('📋 [getHistory] Messages loaded:', {
      count: messages.length,
      withAnalysis: messages.filter(m => m.analysis).length,
      withImages: messages.filter(m => m.analysis?.inputImages?.length > 0).length,
      firstMessageHasAnalysis: !!messages[0]?.analysis,
      firstMessageImages: messages[0]?.analysis?.inputImages?.length || 0
    });

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw httpError(500, 'Failed to get chat history');
  }
};

/**
 * Delete a chat session
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (required)
 * @returns {Promise<object>} Deletion result
 */
export const deleteSession = async ({ sessionId, userId }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const query = { 
      sessionId,
      user: userId
    };

    const result = await ChatMessage.deleteMany(query);
    
    if (result.deletedCount === 0) {
      throw httpError(404, CHAT_ERRORS.SESSION_NOT_FOUND);
    }

    return {
      deletedCount: result.deletedCount,
      sessionId,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to delete session');
  }
};

// ✅ NEW: Load chat context with analysis for AI prompting
/**
 * Load chat history with analysis populated for context-aware AI responses
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (can be null for guest users)
 * @param {number} params.limit - Maximum messages to load (default: 10)
 * @returns {Promise<object>} Chat history with context
 */
export const loadChatContextWithAnalysis = async ({ 
  sessionId, 
  userId, 
  limit = 10 
}) => {
  try {
    if (!sessionId) {
      throw httpError(400, 'sessionId is required');
    }

    // Build query - handle guest users (userId = null)
    const query = { sessionId };
    if (userId) {
      query.user = userId;
    } else {
      query.user = null;  // Explicitly search for guest messages
    }

    // Load chat messages with analysis populated
    const messages = await ChatMessage.find(query)
      .populate({
        path: 'analysis',
        select: 'resultTop source',
        lean: true
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    // Load session with last analysis
    const session = await ChatSession.findOne(query)
      .populate({
        path: 'lastAnalysis',
        select: 'resultTop source',
        lean: true
      })
      .lean();

    return {
      messages,
      session,
      hasContext: messages.some(msg => msg.analysis !== null)
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to load chat context: ${error.message}`);
  }
};

// ✅ NEW: Build context string for AI from chat history
/**
 * Build context prompt from chat history for GPT
 * @param {array} messages - Chat messages with populated analysis
 * @param {object} session - Chat session with last analysis
 * @returns {string} Context string for AI prompt
 */
export const buildContextPromptFromHistory = ({ messages, session }) => {
  try {
    let contextPrompt = '';
    
    // ✅ FIND LATEST IMAGE ANALYSIS - Only use context from most recent plant
    let latestAnalysisIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].analysis && messages[i].messageType !== 'text') {
        latestAnalysisIndex = i;
        break;
      }
    }
    
    // ✅ FILTER: Only use messages from latest analysis onwards
    const relevantMessages = latestAnalysisIndex >= 0 
      ? messages.slice(latestAnalysisIndex) 
      : messages;
    
    console.log(`📊 Context filtering: Total messages: ${messages.length}, Using: ${relevantMessages.length} (from index ${latestAnalysisIndex})`);
    
    // Add context ONLY from current plant conversation
    if (relevantMessages && relevantMessages.length > 0) {
      contextPrompt += '📋 Current Conversation Context:\n';
      contextPrompt += '---\n';
      
      for (const msg of relevantMessages) {
        if (msg.role === 'user') {
          contextPrompt += `👤 User: ${msg.message}\n`;
          
          // Add analysis context if present
          if (msg.analysis && msg.analysis.resultTop) {
            const plant = msg.analysis.resultTop.plant;
            contextPrompt += `🌱 Plant Identified: ${plant.commonName} (${plant.scientificName})\n`;
          }
          
          contextPrompt += '\n';
        } else if (msg.role === 'assistant') {
          // Show first 150 chars for context
          const preview = msg.message.substring(0, 150);
          contextPrompt += `🤖 Assistant: ${preview}${msg.message.length > 150 ? '...' : ''}\n\n`;
        }
      }
      
      contextPrompt += '---\n';
    }
    
    // Emphasize current plant context
    if (session && session.lastAnalysis && session.lastAnalysis.resultTop) {
      const plant = session.lastAnalysis.resultTop.plant;
      contextPrompt += `\n📌 CURRENT PLANT: ${plant.commonName} (${plant.scientificName})\n`;
    }
    
    // ✅ EXPLICIT INSTRUCTION to prioritize latest plant
    contextPrompt += '\n⚠️ IMPORTANT INSTRUCTIONS:\n';
    contextPrompt += '- When user asks "how to grow this plant" or "about this crop", refer to the CURRENT PLANT above.\n';
    contextPrompt += '- ONLY answer about the most recent plant in the conversation.\n';
    contextPrompt += '- Ignore any previous plant discussions from earlier in the chat history.\n';
    contextPrompt += '- If no plant context exists, ask user to provide plant name or upload image.\n\n';
    
    contextPrompt += 'Now answer the user\'s question based on the CURRENT context:\n';
    
    return contextPrompt;
  } catch (error) {
    console.error('Error building context prompt:', error);
    return ''; // Return empty string instead of throwing
  }
};

// ✅ NEW: Save message with analysis reference
/**
 * Save message with analysis reference (for image analysis cases)
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (can be null for guest users)
 * @param {string} params.message - Message content
 * @param {string} params.role - Message role (default: 'user')
 * @param {ObjectId} params.analysisId - Analysis document ID
 * @param {string} params.messageType - Message type (text, image, image-text, analysis)
 * @returns {Promise<object>} Saved message
 */
export const saveMessageWithAnalysis = async ({
  sessionId,
  userId,
  message,
  role = CHAT_ROLES.USER,
  analysisId = null,
  messageType = 'text'
}) => {
  try {
    if (!sessionId || !message) {
      throw httpError(400, 'sessionId and message are required');
    }

    // Create message with analysis reference
    const chatMessage = await ChatMessage.create({
      sessionId,
      user: userId || null,
      role,
      message,
      analysis: analysisId || null,
      messageType,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

    // Update session if this is a new analysis
    if (analysisId && messageType !== 'text') {
      await ChatSession.updateOne(
        { sessionId },
        {
          $set: {
            user: userId,  // ← Required field for upsert
            lastAnalysis: analysisId,
            lastMessageAt: new Date()
          },
          $inc: { messagesCount: 1 }
        },
        { upsert: true }
      );
    } else {
      // Just update last message timestamp and count
      await ChatSession.updateOne(
        { sessionId },
        {
          $set: {
            user: userId,  // ← Required field for upsert
            lastMessageAt: new Date()
          },
          $inc: { messagesCount: 1 }
        },
        { upsert: true }
      );
    }

    return chatMessage;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to save message with analysis: ${error.message}`);
  }
};

/**
 * Delete a specific message
 * @param {object} params - Parameters
 * @param {string} params.messageId - Message ID
 * @param {string} params.userId - User ID (required)
 * @returns {Promise<object>} Deletion result
 */
export const deleteMessage = async ({ messageId, userId }) => {
  try {
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const query = { 
      _id: messageId,
      user: userId
    };

    const message = await ChatMessage.findOneAndDelete(query);
    
    if (!message) {
      throw httpError(404, CHAT_ERRORS.MESSAGE_NOT_FOUND);
    }

    return {
      messageId,
      sessionId: message.sessionId,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to delete message');
  }
};

/**
 * Generate assistant reply with plant context
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {Array} params.messages - Messages array
 * @returns {Promise<object>} Assistant reply
 */
export const generateAssistantReply = async ({ sessionId, messages }) => {
  try {
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === CHAT_ROLES.USER).pop();
    
    if (!lastUserMessage) {
      return {
        role: CHAT_ROLES.ASSISTANT,
        message: "Xin chào! Tôi là trợ lý GreenGrow. Bạn cần hỗ trợ gì về cây trồng?",
        meta: {
          provider: 'greengrow',
          model: 'context-aware',
          tokens: { prompt: 0, completion: 0, total: 0 },
        },
      };
    }

    const userQuery = lastUserMessage.message.toLowerCase();
    let plantContext = null;
    let responseMessage = "";

    // Check if user is asking about specific plants
    const plantKeywords = ['cây', 'plant', 'trồng', 'chăm sóc', 'lan', 'cà chua', 'dưa hấu', 'lúa', 'ngô'];
    const hasPlantKeywords = plantKeywords.some(keyword => userQuery.includes(keyword));

    if (hasPlantKeywords) {
      // Try to extract plant name from query
      const possiblePlantNames = ['lan', 'cà chua', 'dưa hấu', 'lúa', 'ngô', 'khoai', 'cà rốt', 'rau'];
      const mentionedPlant = possiblePlantNames.find(plant => userQuery.includes(plant));
      
      if (mentionedPlant) {
        try {
          plantContext = await getPlantCareInfo({ plantName: mentionedPlant });
        } catch (error) {
          console.warn('Failed to get plant context:', error.message);
        }
      }
    }

    // Generate contextual response
    if (plantContext) {
      responseMessage = `Về cây ${plantContext.name} (${plantContext.scientificName}):\n\n`;
      responseMessage += `**Hướng dẫn chăm sóc:**\n`;
      responseMessage += `- Tưới nước: ${plantContext.careInstructions.watering}\n`;
      responseMessage += `- Ánh sáng: ${plantContext.careInstructions.sunlight}\n`;
      responseMessage += `- Đất trồng: ${plantContext.careInstructions.soil}\n`;
      responseMessage += `- Nhiệt độ: ${plantContext.careInstructions.temperature}\n\n`;
      
      if (plantContext.commonDiseases && plantContext.commonDiseases.length > 0) {
        responseMessage += `**Bệnh thường gặp:**\n`;
        plantContext.commonDiseases.forEach(disease => {
          responseMessage += `- ${disease.name}: ${disease.symptoms}\n`;
          responseMessage += `  Cách điều trị: ${disease.treatment}\n\n`;
        });
      }
      
      if (plantContext.growthStages && plantContext.growthStages.length > 0) {
        responseMessage += `**Các giai đoạn phát triển:**\n`;
        plantContext.growthStages.forEach(stage => {
          responseMessage += `- ${stage.stage}: ${stage.description} (${stage.duration})\n`;
        });
      }
    } else if (userQuery.includes('trồng cây gì') || userQuery.includes('cây gì')) {
      responseMessage = `Tôi có thể tư vấn về nhiều loại cây trồng như:\n`;
      responseMessage += `- Cây cảnh: Lan, Monstera, Fiddle Leaf Fig\n`;
      responseMessage += `- Rau củ: Cà chua, Dưa hấu, Cà rốt\n`;
      responseMessage += `- Cây ăn quả: Xoài, Cam, Chanh\n`;
      responseMessage += `- Cây lương thực: Lúa, Ngô, Khoai\n\n`;
      responseMessage += `Bạn muốn tìm hiểu về loại cây nào cụ thể?`;
    } else {
      responseMessage = `Tôi có thể giúp bạn:\n`;
      responseMessage += `- Tư vấn chăm sóc cây trồng\n`;
      responseMessage += `- Phân tích bệnh cây qua hình ảnh\n`;
      responseMessage += `- Gợi ý sản phẩm phù hợp\n`;
      responseMessage += `- Hướng dẫn trồng cây theo mùa\n\n`;
      responseMessage += `Bạn cần hỗ trợ gì cụ thể?`;
    }

    return {
      role: CHAT_ROLES.ASSISTANT,
      message: responseMessage,
      meta: {
        provider: 'greengrow',
        model: 'context-aware',
        tokens: { prompt: 0, completion: 0, total: 0 },
        plantContext: plantContext ? {
          name: plantContext.name,
          category: plantContext.category
        } : null,
      },
    };
  } catch (error) {
    console.error('Error generating assistant reply:', error);
    return {
      role: CHAT_ROLES.ASSISTANT,
      message: "Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
      meta: {
        provider: 'greengrow',
        model: 'error-fallback',
        tokens: { prompt: 0, completion: 0, total: 0 },
        error: error.message,
      },
    };
  }
};

export default {
  createSession,
  appendMessage,
  updateSessionStats,
  listSessions,
  getHistory,
  deleteSession,
  deleteMessage,
  generateAssistantReply,
};
