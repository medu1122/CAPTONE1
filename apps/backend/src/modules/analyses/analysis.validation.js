import Joi from 'joi';

/**
 * Validation schema for get my plants query
 */
export const validateGetMyPlants = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string()
      .valid('all', 'healthy', 'disease', 'warning')
      .optional(),
    search: Joi.string().max(200).optional().allow(''),
    sortBy: Joi.string()
      .valid('newest', 'oldest', 'nameAsc', 'nameDesc')
      .optional(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  next();
};

/**
 * Validation schema for get analysis by ID
 */
export const validateGetAnalysis = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });

  const { error } = schema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  next();
};

/**
 * Validation schema for delete analysis
 */
export const validateDeleteAnalysis = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });

  const { error } = schema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  next();
};

export default {
  validateGetMyPlants,
  validateGetAnalysis,
  validateDeleteAnalysis,
};

