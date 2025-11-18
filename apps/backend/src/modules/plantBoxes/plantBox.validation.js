import Joi from 'joi';

/**
 * Validation schema for create plant box
 */
export const validateCreatePlantBox = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().required().min(1).max(100),
    plantType: Joi.string().valid('existing', 'planned').required(),
    plantName: Joi.string().trim().required().min(1).max(200),
    scientificName: Joi.string().trim().max(200).optional(),
    plantedDate: Joi.date().optional(),
    plannedDate: Joi.date().optional(),
    expectedHarvestDate: Joi.date().optional(),
    location: Joi.object({
      name: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lon: Joi.number().min(-180).max(180).optional(),
      }).optional(),
      area: Joi.number().min(0).optional(),
      soilType: Joi.string().optional(),
      sunlight: Joi.string().valid('full', 'partial', 'shade').optional(),
    }).required(),
    quantity: Joi.number().integer().min(1).optional(),
    growthStage: Joi.string()
      .valid('seed', 'seedling', 'vegetative', 'flowering', 'fruiting')
      .optional(),
    currentHealth: Joi.string()
      .valid('excellent', 'good', 'fair', 'poor')
      .optional(),
    careLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    wateringMethod: Joi.string()
      .valid('manual', 'drip', 'sprinkler')
      .optional(),
    fertilizerType: Joi.string().optional(),
    purpose: Joi.string()
      .valid('food', 'ornamental', 'medicinal', 'commercial')
      .optional(),
    budgetRange: Joi.string().optional(),
    experienceLevel: Joi.string()
      .valid('beginner', 'intermediate', 'expert')
      .optional(),
    specialRequirements: Joi.string().max(1000).optional(),
    companionPlants: Joi.array().items(Joi.string()).optional(),
    notifications: Joi.object({
      enabled: Joi.boolean().optional(),
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      frequency: Joi.string().valid('daily', 'weekly', 'custom').optional(),
      customSchedule: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  });

  const { error } = schema.validate(req.body);

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
 * Validation schema for update plant box
 */
export const validateUpdatePlantBox = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    plantType: Joi.string().valid('existing', 'planned').optional(),
    plantName: Joi.string().trim().min(1).max(200).optional(),
    scientificName: Joi.string().trim().max(200).optional(),
    plantedDate: Joi.date().optional(),
    plannedDate: Joi.date().optional(),
    expectedHarvestDate: Joi.date().optional(),
    location: Joi.object({
      name: Joi.string().optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lon: Joi.number().min(-180).max(180).optional(),
      }).optional(),
      area: Joi.number().min(0).optional(),
      soilType: Joi.string().optional(),
      sunlight: Joi.string().valid('full', 'partial', 'shade').optional(),
    }).optional(),
    quantity: Joi.number().integer().min(1).optional(),
    growthStage: Joi.string()
      .valid('seed', 'seedling', 'vegetative', 'flowering', 'fruiting')
      .optional(),
    currentHealth: Joi.string()
      .valid('excellent', 'good', 'fair', 'poor')
      .optional(),
    careLevel: Joi.string().valid('low', 'medium', 'high').optional(),
    wateringMethod: Joi.string()
      .valid('manual', 'drip', 'sprinkler')
      .optional(),
    fertilizerType: Joi.string().optional(),
    notifications: Joi.object({
      enabled: Joi.boolean().optional(),
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      frequency: Joi.string().valid('daily', 'weekly', 'custom').optional(),
      customSchedule: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  });

  const { error } = schema.validate(req.body);

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
 * Validation schema for chat message
 */
export const validateChatMessage = (req, res, next) => {
  const schema = Joi.object({
    message: Joi.string().trim().required().min(1).max(500),
  });

  const { error } = schema.validate(req.body);

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
 * Validation schema for add note
 */
export const validateAddNote = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string().trim().required().min(1).max(1000),
    type: Joi.string()
      .valid('care', 'observation', 'issue', 'milestone')
      .optional(),
  });

  const { error } = schema.validate(req.body);

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
 * Validation schema for add image
 */
export const validateAddImage = (req, res, next) => {
  const schema = Joi.object({
    url: Joi.string().uri().required(),
    description: Joi.string().trim().max(500).optional(),
  });

  const { error } = schema.validate(req.body);

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
  validateCreatePlantBox,
  validateUpdatePlantBox,
  validateChatMessage,
  validateAddNote,
  validateAddImage,
};

