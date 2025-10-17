import Joi from 'joi';

/**
 * Validation schema for plant query parameters
 */
export const plantQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: Joi.string().valid(
    'vegetable',
    'fruit', 
    'herb',
    'flower',
    'tree',
    'other'
  ).optional(),
  search: Joi.string().trim().max(100).optional(),
});

/**
 * Validation schema for plant search query
 */
export const plantSearchSchema = Joi.object({
  q: Joi.string().trim().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validation schema for plant creation
 */
export const createPlantSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  scientificName: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(1).max(2000).required(),
  careInstructions: Joi.object({
    watering: Joi.string().trim().min(1).max(500).required(),
    sunlight: Joi.string().trim().min(1).max(500).required(),
    soil: Joi.string().trim().min(1).max(500).required(),
    temperature: Joi.string().trim().min(1).max(500).required(),
  }).required(),
  growthStages: Joi.array().items(
    Joi.object({
      stage: Joi.string().trim().min(1).max(100).required(),
      description: Joi.string().trim().min(1).max(500).required(),
      duration: Joi.string().trim().min(1).max(100).required(),
    })
  ).optional(),
  commonDiseases: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      symptoms: Joi.string().trim().min(1).max(500).required(),
      treatment: Joi.string().trim().min(1).max(500).required(),
    })
  ).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().trim().max(200).optional(),
    })
  ).optional(),
  category: Joi.string().valid(
    'vegetable',
    'fruit',
    'herb',
    'flower',
    'tree',
    'other'
  ).required(),
});

/**
 * Validation schema for plant update
 */
export const updatePlantSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  scientificName: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().min(1).max(2000).optional(),
  careInstructions: Joi.object({
    watering: Joi.string().trim().min(1).max(500).optional(),
    sunlight: Joi.string().trim().min(1).max(500).optional(),
    soil: Joi.string().trim().min(1).max(500).optional(),
    temperature: Joi.string().trim().min(1).max(500).optional(),
  }).optional(),
  growthStages: Joi.array().items(
    Joi.object({
      stage: Joi.string().trim().min(1).max(100).required(),
      description: Joi.string().trim().min(1).max(500).required(),
      duration: Joi.string().trim().min(1).max(100).required(),
    })
  ).optional(),
  commonDiseases: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      symptoms: Joi.string().trim().min(1).max(500).required(),
      treatment: Joi.string().trim().min(1).max(500).required(),
    })
  ).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().trim().max(200).optional(),
    })
  ).optional(),
  category: Joi.string().valid(
    'vegetable',
    'fruit',
    'herb',
    'flower',
    'tree',
    'other'
  ).optional(),
});

/**
 * Validation middleware for plant queries
 */
export const validatePlantQuery = (req, res, next) => {
  const { error, value } = plantQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.query = value;
  next();
};

/**
 * Validation middleware for plant search
 */
export const validatePlantSearch = (req, res, next) => {
  const { error, value } = plantSearchSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.query = value;
  next();
};

/**
 * Validation middleware for plant creation
 */
export const validateCreatePlant = (req, res, next) => {
  const { error, value } = createPlantSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.body = value;
  next();
};

/**
 * Validation middleware for plant update
 */
export const validateUpdatePlant = (req, res, next) => {
  const { error, value } = updatePlantSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.body = value;
  next();
};
