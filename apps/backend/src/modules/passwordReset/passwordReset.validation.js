import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate request password reset
 */
export const validateRequestPasswordReset = (req, res, next) => {
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
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate reset token
 */
export const validateResetToken = (req, res, next) => {
  const schema = Joi.object({
    resetToken: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]+$/)
      .messages({
        'string.empty': 'Reset token is required',
        'string.length': 'Reset token must be 64 characters',
        'string.pattern.base': 'Reset token must be a valid hex string',
        'any.required': 'Reset token is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate reset password request
 */
export const validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    resetToken: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]+$/)
      .messages({
        'string.empty': 'Reset token is required',
        'string.length': 'Reset token must be 64 characters',
        'string.pattern.base': 'Reset token must be a valid hex string',
        'any.required': 'Reset token is required',
      }),
    newPassword: Joi.string()
      .required()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'New password is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

export default {
  validateRequestPasswordReset,
  validateResetToken,
  validateResetPassword,
};
