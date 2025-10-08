import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create verification token request
 */
export const validateCreateVerificationToken = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string()
      .required()
      .messages({
        'string.empty': 'User ID is required',
        'any.required': 'User ID is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate verify email request
 */
export const validateVerifyEmail = (req, res, next) => {
  const schema = Joi.object({
    verificationToken: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]+$/)
      .messages({
        'string.empty': 'Verification token is required',
        'string.length': 'Verification token must be 64 characters',
        'string.pattern.base': 'Verification token must be a valid hex string',
        'any.required': 'Verification token is required',
      }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate verification token parameter
 */
export const validateVerificationToken = (req, res, next) => {
  const schema = Joi.object({
    verificationToken: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]+$/)
      .messages({
        'string.empty': 'Verification token is required',
        'string.length': 'Verification token must be 64 characters',
        'string.pattern.base': 'Verification token must be a valid hex string',
        'any.required': 'Verification token is required',
      }),
  });
  
  const { error } = schema.validate(req.params);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

export default {
  validateCreateVerificationToken,
  validateVerifyEmail,
  validateVerificationToken,
};
