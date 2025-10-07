import crypto from 'crypto';
import mongoose from 'mongoose';
import ChatMessage from './chat.model.js';
import { CHAT_ROLES, CHAT_LIMITS, CHAT_ERRORS } from './chat.constants.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create a new chat session
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<object>} Session creation result
 */
export const createSession = async ({ userId = null }) => {
  try {
    const sessionId = crypto.randomUUID();
    
    // Ensure sessionId is unique (very unlikely collision, but safety check)
    const existingSession = await ChatMessage.findOne({ sessionId });
    if (existingSession) {
      // Retry with new UUID (extremely rare case)
      return createSession({ userId });
    }

    return {
      sessionId,
      userId,
    };
  } catch (error) {
    throw httpError(500, 'Failed to create session');
  }
};

/**
 * Append a message to a chat session
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.role - Message role
 * @param {string} params.message - Message content
 * @param {object} params.meta - Additional metadata (optional)
 * @returns {Promise<object>} Created message
 */
export const appendMessage = async ({ sessionId, userId = null, role, message, meta = {} }) => {
  try {
    const chatMessage = new ChatMessage({
      sessionId,
      user: userId,
      role,
      message,
      meta,
    });

    const savedMessage = await chatMessage.save();
    return savedMessage;
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw httpError(400, error.message);
    }
    throw httpError(500, 'Failed to save message');
  }
};

/**
 * List chat sessions for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<object>} Sessions list with pagination
 */
export const listSessions = async ({ userId, page = CHAT_LIMITS.PAGINATION.DEFAULT_PAGE, limit = CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT }) => {
  try {
    if (!userId) {
      return {
        sessions: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      };
    }

    const skip = (page - 1) * limit;
    
    // Aggregate to get sessions with message counts and last message time
    const sessions = await ChatMessage.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$sessionId',
          lastMessageAt: { $max: '$createdAt' },
          messagesCount: { $sum: 1 },
          firstMessage: { $first: '$message' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          sessionId: '$_id',
          lastMessageAt: 1,
          messagesCount: 1,
          firstMessage: 1,
          _id: 0,
        },
      },
    ]);

    const total = await ChatMessage.distinct('sessionId', { user: userId }).then(sessions => sessions.length);

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
 * @param {string} params.userId - User ID (optional)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.q - Search query (optional)
 * @param {Date} params.from - Start date (optional)
 * @param {Date} params.to - End date (optional)
 * @returns {Promise<object>} Chat history with pagination
 */
export const getHistory = async ({ 
  sessionId, 
  userId = null, 
  page = CHAT_LIMITS.PAGINATION.DEFAULT_PAGE, 
  limit = CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT,
  q = null,
  from = null,
  to = null 
}) => {
  try {
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { sessionId };
    
    // Add user filter if userId provided
    if (userId) {
      query.user = userId;
    }
    
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
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<object>} Deletion result
 */
export const deleteSession = async ({ sessionId, userId = null }) => {
  try {
    const query = { sessionId };
    
    // Add user filter if userId provided
    if (userId) {
      query.user = userId;
    }

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
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<object>} Deletion result
 */
export const deleteMessage = async ({ messageId, userId = null }) => {
  try {
    const query = { _id: messageId };
    
    // Add user filter if userId provided
    if (userId) {
      query.user = userId;
    }

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
 * Generate assistant reply (TODO: Integrate with LLM)
 * @param {object} params - Parameters
 * @param {string} params.sessionId - Session ID
 * @param {Array} params.messages - Messages array
 * @returns {Promise<object>} Assistant reply
 */
export const generateAssistantReply = async ({ sessionId, messages }) => {
  // TODO: Integrate with LLM service
  // This is a placeholder implementation
  // Expected implementation:
  // 1. Process messages array
  // 2. Call LLM service (OpenAI, Claude, etc.)
  // 3. Return structured response with metadata
  
  return {
    role: CHAT_ROLES.ASSISTANT,
    message: "(assistant reply placeholder - LLM integration pending)",
    meta: {
      provider: 'placeholder',
      model: 'placeholder',
      tokens: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
    },
  };
};

export default {
  createSession,
  appendMessage,
  listSessions,
  getHistory,
  deleteSession,
  deleteMessage,
  generateAssistantReply,
};
