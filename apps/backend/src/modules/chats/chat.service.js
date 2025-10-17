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
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const skip = (page - 1) * limit;
    
    // Get sessions from ChatSession collection
    const [sessions, total] = await Promise.all([
      ChatSession.find({ user: userId })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments({ user: userId }),
    ]);

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
    if (!userId) {
      throw httpError(400, 'User ID is required');
    }

    const skip = (page - 1) * limit;
    
    // Build query - now always include user filter
    const query = { 
      sessionId,
      user: userId
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
        .sort({ createdAt: 1 }) // Chronological order
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments(query),
    ]);

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
