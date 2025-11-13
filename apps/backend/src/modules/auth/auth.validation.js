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

/**
 * Validate verify email request
 */
export const validateVerifyEmail = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string()
      .required()
      .length(64)
      .pattern(/^[a-f0-9]+$/)
      .messages({
        'string.empty': 'Verification token is required',
        'string.length': 'Verification token must be 64 characters',
        'string.pattern.base': 'Verification token must be a valid hex string',
        'any.required': 'Verification token is required',
      }),
    uid: Joi.string()
      .required()
      .messages({
        'string.empty': 'User ID is required',
        'any.required': 'User ID is required',
      }),
  });
  
  const { error } = schema.validate(req.query);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  next();
};

/**
 * Validate resend verification email request
 */
export const validateResendVerification = (req, res, next) => {
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
 * Validate update profile request
 */
export const validateUpdateProfile = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
      }),
    phone: Joi.string()
      .trim()
      .allow(null, '')
      .optional()
      .messages({
        'string.empty': 'Phone cannot be empty string',
      }),
    bio: Joi.string()
      .max(500)
      .trim()
      .allow(null, '')
      .optional()
      .messages({
        'string.max': 'Bio cannot exceed 500 characters',
      }),
    profileImage: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        'string.uri': 'Profile image must be a valid URL',
      }),
    location: Joi.object({
      address: Joi.string().allow(null, '').optional(),
      province: Joi.string().allow(null, '').optional(),
      city: Joi.string().allow(null, '').optional(),
      // Coordinates removed from validation (not displayed in UI)
    }).optional(),
    settings: Joi.object({
      emailNotifications: Joi.boolean().optional(),
      smsNotifications: Joi.boolean().optional(),
      language: Joi.string().valid('vi', 'en').optional(),
      theme: Joi.string().valid('light', 'dark').optional(),
      privacy: Joi.object({
        profileVisibility: Joi.string().valid('public', 'private', 'friends').optional(),
        showEmail: Joi.boolean().optional(),
        showPhone: Joi.boolean().optional(),
      }).optional(),
    }).optional(),
    farmerProfile: Joi.object({
      farmName: Joi.string().allow(null, '').optional(),
      farmSize: Joi.string().allow(null, '').optional(),
      farmType: Joi.string().allow(null, '').optional(),
      crops: Joi.array().items(Joi.string()).optional(),
      experience: Joi.string().allow(null, '').optional(),
      certifications: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    buyerProfile: Joi.object({
      preferences: Joi.array().items(Joi.string()).optional(),
      budgetRange: Joi.string().allow(null, '').optional(),
      purchaseFrequency: Joi.string().allow(null, '').optional(),
    }).optional(),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
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
  validateVerifyEmail,
  validateResendVerification,
  validateUpdateProfile,
};