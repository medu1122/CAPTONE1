import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';
import { CHAT_ROLES, CHAT_LIMITS } from './chat.constants.js';

/**
 * Validate start session request
 */
export const validateStartSession = (req, res, next) => {
  // No body validation needed for session creation
  next();
};

/**
 * Validate send message request
 */
export const validateSendMessage = (req, res, next) => {
  const schema = Joi.object({
    sessionId: Joi.string().required().messages({
      'string.empty': 'Session ID is required',
      'any.required': 'Session ID is required',
    }),
    role: Joi.string()
      .valid(...Object.values(CHAT_ROLES))
      .default(CHAT_ROLES.USER)
      .messages({
        'any.only': `Role must be one of: ${Object.values(CHAT_ROLES).join(', ')}`,
      }),
    message: Joi.string()
      .required()
      .min(1)
      .max(CHAT_LIMITS.MESSAGE_MAX_LENGTH)
      .messages({
        'string.empty': 'Message is required',
        'string.min': 'Message cannot be empty',
        'string.max': `Message cannot exceed ${CHAT_LIMITS.MESSAGE_MAX_LENGTH} characters`,
        'any.required': 'Message is required',
      }),
    meta: Joi.object().default({}).messages({
      'object.base': 'Meta must be an object',
    }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate get history request
 */
export const validateGetHistory = (req, res, next) => {
  const schema = Joi.object({
    sessionId: Joi.string().required().messages({
      'string.empty': 'Session ID is required',
      'any.required': 'Session ID is required',
    }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(CHAT_LIMITS.PAGINATION.DEFAULT_PAGE)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(CHAT_LIMITS.PAGINATION.MAX_LIMIT)
      .default(CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': `Limit cannot exceed ${CHAT_LIMITS.PAGINATION.MAX_LIMIT}`,
      }),
    q: Joi.string().allow('').optional().messages({
      'string.base': 'Search query must be a string',
    }),
    from: Joi.date().iso().optional().messages({
      'date.format': 'From date must be in ISO format',
    }),
    to: Joi.date().iso().min(Joi.ref('from')).optional().messages({
      'date.format': 'To date must be in ISO format',
      'date.min': 'To date must be after from date',
    }),
  });
  
  const { error } = schema.validate(req.query);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate list sessions request
 */
export const validateListSessions = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(CHAT_LIMITS.PAGINATION.DEFAULT_PAGE)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(CHAT_LIMITS.PAGINATION.MAX_LIMIT)
      .default(CHAT_LIMITS.PAGINATION.DEFAULT_LIMIT)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': `Limit cannot exceed ${CHAT_LIMITS.PAGINATION.MAX_LIMIT}`,
      }),
  });
  
  const { error } = schema.validate(req.query);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate session ID parameter
 */
export const validateSessionId = (req, res, next) => {
  const schema = Joi.object({
    sessionId: Joi.string().required().messages({
      'string.empty': 'Session ID is required',
      'any.required': 'Session ID is required',
    }),
  });
  
  const { error } = schema.validate(req.params);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate message ID parameter
 */
export const validateMessageId = (req, res, next) => {
  const schema = Joi.object({
    messageId: Joi.string().required().messages({
      'string.empty': 'Message ID is required',
      'any.required': 'Message ID is required',
    }),
  });
  
  const { error } = schema.validate(req.params);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

export default {
  validateStartSession,
  validateSendMessage,
  validateGetHistory,
  validateListSessions,
  validateSessionId,
  validateMessageId,
};
