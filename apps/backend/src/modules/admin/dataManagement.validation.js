import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';

/**
 * Validate product creation/update
 */
export const validateProduct = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(200),
    activeIngredient: Joi.string().required().min(1).max(200),
    manufacturer: Joi.string().required().min(1).max(200),
    targetDiseases: Joi.array().items(Joi.string().min(1)).min(1).required(),
    targetCrops: Joi.array().items(Joi.string().min(1)).min(1).required(),
    dosage: Joi.string().required().min(1),
    usage: Joi.string().required().min(1),
    price: Joi.string().optional().allow(''),
    imageUrl: Joi.string().uri().optional().allow(''),
    source: Joi.string().required().min(1),
    verified: Joi.boolean().optional(),
    frequency: Joi.string().optional().allow(''),
    isolationPeriod: Joi.string().optional().allow(''),
    precautions: Joi.array().items(Joi.string()).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

/**
 * Validate biological method creation/update
 */
export const validateBiologicalMethod = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(200),
    targetDiseases: Joi.array().items(Joi.string().min(1)).min(1).required(),
    materials: Joi.string().required().min(1),
    steps: Joi.string().required().min(1),
    timeframe: Joi.string().required().min(1),
    effectiveness: Joi.string().required().min(1),
    source: Joi.string().required().min(1),
    verified: Joi.boolean().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

/**
 * Validate cultural practice creation/update
 */
export const validateCulturalPractice = (req, res, next) => {
  const schema = Joi.object({
    category: Joi.string()
      .valid('soil', 'water', 'fertilizer', 'light', 'spacing')
      .required(),
    action: Joi.string().required().min(1).max(200),
    description: Joi.string().required().min(1),
    priority: Joi.string().valid('High', 'Medium', 'Low').default('Medium'),
    applicableTo: Joi.array().items(Joi.string().min(1)).min(1).required(),
    source: Joi.string().required().min(1),
    verified: Joi.boolean().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

