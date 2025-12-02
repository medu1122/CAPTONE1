import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create report request
 */
export const validateCreateReport = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('post', 'comment')
      .required()
      .messages({
        'any.required': 'Report type is required',
        'any.only': 'Report type must be one of: post, comment',
      }),
    targetId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'any.required': 'Target ID is required',
        'string.pattern.base': 'Target ID must be a valid ObjectId',
      }),
    targetType: Joi.string()
      .valid('post', 'comment')
      .required()
      .messages({
        'any.required': 'Target type is required',
        'any.only': 'Target type must be one of: post, comment',
      }),
    reason: Joi.string()
      .valid('spam', 'inappropriate', 'harassment', 'fake', 'other')
      .required()
      .messages({
        'any.required': 'Report reason is required',
        'any.only': 'Report reason must be one of: spam, inappropriate, harassment, fake, other',
      }),
    description: Joi.string()
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
      .valid('post', 'comment')
      .optional(),
    status: Joi.string()
      .valid('pending', 'reviewing', 'resolved', 'dismissed')
      .optional(),
    reason: Joi.string()
      .valid('spam', 'inappropriate', 'harassment', 'fake', 'other')
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

  const { error, value } = schema.validate(req.query);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.query = { ...req.query, ...value };
  next();
};

