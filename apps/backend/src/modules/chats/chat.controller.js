import { httpSuccess } from '../../common/utils/http.js';
import chatService from './chat.service.js';
import { CHAT_SUCCESS } from './chat.constants.js';

/**
 * Start a new chat session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const startSession = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const result = await chatService.createSession({ userId });
    
    const { statusCode, body } = httpSuccess(201, CHAT_SUCCESS.SESSION_CREATED, {
      sessionId: result.sessionId,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a chat session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, role, message, meta } = req.body;
    const userId = req.user?.id || null;
    
    const savedMessage = await chatService.appendMessage({
      sessionId,
      userId,
      role,
      message,
      meta,
    });
    
    const { statusCode, body } = httpSuccess(201, CHAT_SUCCESS.MESSAGE_SENT, {
      messageId: savedMessage._id,
      sessionId: savedMessage.sessionId,
      role: savedMessage.role,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat history for a session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const getHistory = async (req, res, next) => {
  try {
    const { sessionId, page, limit, q, from, to } = req.query;
    const userId = req.user?.id || null;
    
    const result = await chatService.getHistory({
      sessionId,
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      from,
      to,
    });
    
    const { statusCode, body } = httpSuccess(200, CHAT_SUCCESS.HISTORY_RETRIEVED, {
      sessionId,
      messages: result.messages,
      pagination: result.pagination,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * List chat sessions for the current user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const listSessions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user?.id || null;
    
    const result = await chatService.listSessions({
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    
    const { statusCode, body } = httpSuccess(200, CHAT_SUCCESS.SESSIONS_LISTED, {
      sessions: result.sessions,
      pagination: result.pagination,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a chat session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || null;
    
    const result = await chatService.deleteSession({ sessionId, userId });
    
    const { statusCode, body } = httpSuccess(200, CHAT_SUCCESS.SESSION_DELETED, {
      sessionId: result.sessionId,
      deletedCount: result.deletedCount,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || null;
    
    const result = await chatService.deleteMessage({ messageId, userId });
    
    const { statusCode, body } = httpSuccess(200, CHAT_SUCCESS.MESSAGE_DELETED, {
      messageId: result.messageId,
      sessionId: result.sessionId,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  startSession,
  sendMessage,
  getHistory,
  listSessions,
  deleteSession,
  deleteMessage,
};
