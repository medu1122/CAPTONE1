import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create report request
 */
export const validateCreateReport = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('post', 'comment', 'analysis')
      .required()
      .messages({
        'any.required': 'Report type is required',
        'any.only': 'Report type must be one of: post, comment, analysis',
      }),
    targetId: Joi.alternatives()
      .try(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // ObjectId
        Joi.string().min(1).max(100) // String ID (for analysis)
      )
      .required()
      .messages({
        'any.required': 'Target ID is required',
      }),
    targetType: Joi.string()
      .valid('post', 'comment', 'analysis')
      .required()
      .messages({
        'any.required': 'Target type is required',
        'any.only': 'Target type must be one of: post, comment, analysis',
      }),
    reason: Joi.string()
      .valid('spam', 'inappropriate', 'harassment', 'fake', 'error', 'wrong_result', 'other')
      .required()
      .messages({
        'any.required': 'Report reason is required',
        'any.only': 'Report reason must be one of: spam, inappropriate, harassment, fake, error, wrong_result, other',
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .allow(null, ''),
    originalImageUrl: Joi.string()
      .uri()
      .optional()
      .allow(null, ''),
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .optional()
      .default([]),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.body = { ...req.body, ...value };
  next();
};

/**
 * Validate update report status (admin only)
 */
export const validateUpdateReportStatus = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('pending', 'reviewing', 'resolved', 'dismissed')
      .required()
      .messages({
        'any.required': 'Status is required',
        'any.only': 'Status must be one of: pending, reviewing, resolved, dismissed',
      }),
    adminNotes: Joi.string()
      .max(1000)
      .trim()
      .optional()
      .allow(null, ''),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.body = { ...req.body, ...value };
  next();
};

/**
 * Validate get reports query
 */
export const validateGetReports = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('post', 'comment', 'analysis')
      .optional(),
    status: Joi.string()
      .valid('pending', 'reviewing', 'resolved', 'dismissed')
      .optional(),
    reason: Joi.string()
      .valid('spam', 'inappropriate', 'harassment', 'fake', 'error', 'wrong_result', 'other')
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'status')
      .default('createdAt'),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
  });

  const { error, value } = schema.validate(req.query, {
    convert: true, // Auto convert strings to numbers
  });
  
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  // Ensure page and limit are numbers
  if (value.page) value.page = parseInt(value.page, 10) || 1;
  if (value.limit) value.limit = parseInt(value.limit, 10) || 20;

  // Update query properties directly (req.query is read-only, so modify properties)
  Object.keys(value).forEach(key => {
    req.query[key] = value[key];
  });
  
  next();
};

