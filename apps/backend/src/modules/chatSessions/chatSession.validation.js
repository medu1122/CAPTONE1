import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create session request
 */
export const validateCreateSession = (req, res, next) => {
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
 * Validate get sessions request
 */
export const validateGetSessions = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    search: Joi.string()
      .allow('')
      .optional()
      .messages({
        'string.base': 'Search must be a string',
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
  });
  
  const { error } = schema.validate(req.params);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate update session title request
 */
export const validateUpdateTitle = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .required()
      .max(200)
      .trim()
      .messages({
        'string.empty': 'Title is required',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate update session meta request
 */
export const validateUpdateMeta = (req, res, next) => {
  const schema = Joi.object({
    meta: Joi.object()
      .required()
      .messages({
        'object.base': 'Meta must be an object',
        'any.required': 'Meta is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

export default {
  validateCreateSession,
  validateGetSessions,
  validateSessionId,
  validateUpdateTitle,
  validateUpdateMeta,
};
