import crypto from 'crypto';
import ChatSession from './chatSession.model.js';
import ChatMessage from '../chats/chat.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create a new chat session
 * @param {string} userId - User ID
 * @param {object} options - Session options
 * @returns {Promise<object>} Created session
 */
export const createSession = async (userId, options = {}) => {
  try {
    const sessionId = crypto.randomUUID();
    
    // Ensure sessionId is unique (very unlikely collision, but safety check)
    const existingSession = await ChatSession.findOne({ sessionId });
    if (existingSession) {
      // Retry with new UUID (extremely rare case)
      return createSession(userId, options);
    }

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
    throw httpError(500, 'Failed to create session');
  }
};

/**
 * Get user sessions with pagination
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Sessions list
 */
export const getUserSessions = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, search = null } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query = { user: userId };
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const [sessions, total] = await Promise.all([
      ChatSession.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments(query),
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
    throw httpError(500, 'Failed to get user sessions');
  }
};

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Session details
 */
export const getSessionById = async (sessionId, userId) => {
  try {
    const session = await ChatSession.findOne({
      sessionId,
      user: userId,
    });

    if (!session) {
      throw httpError(404, 'Session not found');
    }

    return session;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to get session');
  }
};

/**
 * Update session title
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} title - New title
 * @returns {Promise<object>} Updated session
 */
export const updateSessionTitle = async (sessionId, userId, title) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, user: userId },
      { title },
      { new: true, runValidators: true }
    );

    if (!session) {
      throw httpError(404, 'Session not found');
    }

    return {
      sessionId: session.sessionId,
      title: session.title,
      updatedAt: session.updatedAt,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to update session title');
  }
};

/**
 * Update session metadata
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {object} meta - Metadata to update
 * @returns {Promise<object>} Updated session
 */
export const updateSessionMeta = async (sessionId, userId, meta) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId, user: userId },
      { meta },
      { new: true, runValidators: true }
    );

    if (!session) {
      throw httpError(404, 'Session not found');
    }

    return {
      sessionId: session.sessionId,
      meta: session.meta,
      updatedAt: session.updatedAt,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to update session metadata');
  }
};

/**
 * Update session statistics (called when new message is added)
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
 * Delete session and all its messages
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Deletion result
 */
export const deleteSession = async (sessionId, userId) => {
  try {
    const session = await ChatSession.findOne({ sessionId, user: userId });
    if (!session) {
      throw httpError(404, 'Session not found');
    }

    // Delete all messages in this session
    const messagesResult = await ChatMessage.deleteMany({ sessionId });

    // Delete the session
    await ChatSession.deleteOne({ sessionId });

    return {
      sessionId,
      deletedMessages: messagesResult.deletedCount,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to delete session');
  }
};

export default {
  createSession,
  getUserSessions,
  getSessionById,
  updateSessionTitle,
  updateSessionMeta,
  updateSessionStats,
  deleteSession,
};
