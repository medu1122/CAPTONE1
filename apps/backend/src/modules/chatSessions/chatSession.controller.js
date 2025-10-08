import { httpSuccess } from '../../common/utils/http.js';
import chatSessionService from './chatSession.service.js';

/**
 * Create a new chat session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const createSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, meta } = req.body;
    
    const result = await chatSessionService.createSession(userId, { title, meta });
    
    const { statusCode, body } = httpSuccess(201, 'Session created successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user sessions
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, search } = req.query;
    
    const result = await chatSessionService.getUserSessions(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
    });
    
    const { statusCode, body } = httpSuccess(200, 'Sessions retrieved successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get session by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const result = await chatSessionService.getSessionById(sessionId, userId);
    
    const { statusCode, body } = httpSuccess(200, 'Session retrieved successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Update session title
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const updateSessionTitle = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    
    const result = await chatSessionService.updateSessionTitle(sessionId, userId, title);
    
    const { statusCode, body } = httpSuccess(200, 'Session title updated successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Update session metadata
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const updateSessionMeta = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { meta } = req.body;
    const userId = req.user.id;
    
    const result = await chatSessionService.updateSessionMeta(sessionId, userId, meta);
    
    const { statusCode, body } = httpSuccess(200, 'Session metadata updated successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const deleteSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const result = await chatSessionService.deleteSession(sessionId, userId);
    
    const { statusCode, body } = httpSuccess(200, 'Session deleted successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  createSession,
  getUserSessions,
  getSessionById,
  updateSessionTitle,
  updateSessionMeta,
  deleteSession,
};
