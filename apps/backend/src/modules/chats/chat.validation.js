import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';
import { CHAT_ROLES, CHAT_LIMITS } from './chat.constants.js';

/**
 * Validate start session request
 */
export const validateStartSession = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .allow(null, '')
      .max(200)
      .trim()
      .messages({
        'string.max': 'Title cannot exceed 200 characters',
      }),
    meta: Joi.object()
      .default({})
      .messages({
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
 * Validate send message request
 */
export const validateSendMessage = (req, res, next) => {
  const attachmentSchema = Joi.object({
    url: Joi.string().required().messages({
      'string.empty': 'Attachment URL is required',
      'any.required': 'Attachment URL is required',
    }),
    filename: Joi.string().required().messages({
      'string.empty': 'Attachment filename is required',
      'any.required': 'Attachment filename is required',
    }),
    mimeType: Joi.string().required().messages({
      'string.empty': 'Attachment mime type is required',
      'any.required': 'Attachment mime type is required',
    }),
    size: Joi.number().required().min(1).messages({
      'number.base': 'Attachment size must be a number',
      'number.min': 'Attachment size must be greater than 0',
      'any.required': 'Attachment size is required',
    }),
  });

  const relatedSchema = Joi.object({
    analysisId: Joi.string().optional(),
    plantId: Joi.string().optional(),
    postId: Joi.string().optional(),
  }).min(1).messages({
    'object.min': 'Related must have at least one reference',
  });

  const schema = Joi.object({
    sessionId: Joi.string()
      .required()
      .length(36)
      .pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      .messages({
        'string.empty': 'Session ID is required',
        'string.length': 'Session ID must be a valid UUID',
        'string.pattern.base': 'Session ID must be a valid UUID v4',
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
    attachments: Joi.array()
      .items(attachmentSchema)
      .default([])
      .messages({
        'array.base': 'Attachments must be an array',
      }),
    related: Joi.object()
      .allow(null)
      .default(null)
      .messages({
        'object.base': 'Related must be an object',
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
