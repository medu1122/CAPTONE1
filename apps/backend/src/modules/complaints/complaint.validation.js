import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create complaint request
 */
export const validateCreateComplaint = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('analysis', 'chatbot', 'my-plants', 'map', 'general')
      .required()
      .messages({
        'any.required': 'Complaint type is required',
        'any.only': 'Complaint type must be one of: analysis, chatbot, my-plants, map, general',
      }),
    category: Joi.string()
      .valid('error', 'suggestion', 'bug', 'other')
      .optional()
      .default('other'),
    title: Joi.string()
      .required()
      .min(3)
      .max(200)
      .trim()
      .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required',
      }),
    description: Joi.string()
      .required()
      .min(10)
      .max(2000)
      .trim()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Description is required',
      }),
    relatedId: Joi.alternatives()
      .try(
        Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // ObjectId format
        Joi.string().min(1).max(50), // Other ID formats (e.g., province codes, etc.)
        Joi.allow(null)
      )
      .optional()
      .allow(null),
    relatedType: Joi.string()
      .valid('analysis', 'post', 'plant', 'plantBox', 'map')
      .optional()
      .allow(null),
    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          filename: Joi.string().required(),
          mimeType: Joi.string().required(),
        })
      )
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
 * Validate update complaint status (admin only)
 */
export const validateUpdateComplaintStatus = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('pending', 'reviewing', 'resolved', 'rejected')
      .required()
      .messages({
        'any.required': 'Status is required',
        'any.only': 'Status must be one of: pending, reviewing, resolved, rejected',
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
 * Validate get complaints query
 */
export const validateGetComplaints = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('analysis', 'chatbot', 'my-plants', 'map', 'general')
      .optional(),
    status: Joi.string()
      .valid('pending', 'reviewing', 'resolved', 'rejected')
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

