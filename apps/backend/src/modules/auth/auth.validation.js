import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate register request
 */
export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .required()
      .min(2)
      .max(50)
      .trim()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'Password is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate login request
 */
export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate refresh token request
 */
export const validateRefreshToken = (req, res, next) => {
  const schema = Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Refresh token is required',
        'any.required': 'Refresh token is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate logout request
 */
export const validateLogout = (req, res, next) => {
  const schema = Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Refresh token is required',
        'any.required': 'Refresh token is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

export default {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateLogout,
};