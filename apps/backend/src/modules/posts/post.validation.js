import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate create post request
 * Handles both JSON and FormData requests
 */
export const validateCreatePost = (req, res, next) => {
  // For FormData, multer already parsed text fields into req.body
  // For JSON, req.body is already parsed by express.json()
  
  // Parse JSON strings from FormData if needed
  let tags = req.body.tags;
  if (tags && typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch (e) {
      tags = [];
    }
  }
  
  let plants = req.body.plants;
  if (plants && typeof plants === 'string') {
    try {
      plants = JSON.parse(plants);
    } catch (e) {
      plants = [];
    }
  }
  
  // Prepare data for validation (combine req.body with parsed arrays)
  const dataToValidate = {
    title: req.body.title,
    content: req.body.content,
    category: req.body.category || 'discussion',
    status: req.body.status || 'published',
    tags: tags,
    plants: plants,
    // images will be handled separately (from req.files or req.body.images)
  };
  
  const schema = Joi.object({
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
    content: Joi.string()
      .required()
      .min(10)
      .max(5000)
      .trim()
      .messages({
        'string.empty': 'Content is required',
        'string.min': 'Content must be at least 10 characters',
        'string.max': 'Content cannot exceed 5000 characters',
        'any.required': 'Content is required',
      }),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional(),
    plants: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .optional(),
    category: Joi.string()
      .valid('question', 'discussion', 'tip', 'problem', 'success', 'other')
      .optional()
      .default('discussion'),
    status: Joi.string()
      .valid('draft', 'pending', 'published', 'rejected', 'archived')
      .optional()
      .default('published'),
  });

  const { error, value } = schema.validate(dataToValidate);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  // Update req.body with validated and parsed values
  req.body = {
    ...req.body,
    ...value,
    tags: value.tags || [],
    plants: value.plants || [],
  };

  next();
};

/**
 * Validate update post request
 */
export const validateUpdatePost = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .trim()
      .optional(),
    content: Joi.string()
      .min(10)
      .max(5000)
      .trim()
      .optional(),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: Joi.string().max(500).optional(),
        })
      )
      .max(10)
      .optional(),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional(),
    plants: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .optional(),
    category: Joi.string()
      .valid('question', 'discussion', 'tip', 'problem', 'success', 'other')
      .optional(),
    status: Joi.string()
      .valid('draft', 'pending', 'published', 'rejected', 'archived')
      .optional(),
  }).min(1); // At least one field must be provided

  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  next();
};

/**
 * Validate add comment request
 */
export const validateAddComment = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .trim()
      .messages({
        'string.empty': 'Comment content is required',
        'string.min': 'Comment must be at least 1 character',
        'string.max': 'Comment cannot exceed 1000 characters',
        'any.required': 'Comment content is required',
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  next();
};

/**
 * Validate query parameters for get all posts
 */
export const validateGetPosts = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    tag: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
    category: Joi.string()
      .valid('question', 'discussion', 'tip', 'problem', 'success', 'other')
      .optional(),
    sortBy: Joi.string()
      .valid('latest', 'popular', 'mostCommented')
      .optional()
      .default('latest'),
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  next();
};

