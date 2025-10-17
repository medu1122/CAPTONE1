import Joi from 'joi';

/**
 * Validation schema for AI response generation
 */
export const generateResponseSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().trim().min(1).max(4000).required(),
    })
  ).min(1).max(50).required(),
  weather: Joi.object({
    current: Joi.object({
      temperature: Joi.number().required(),
      humidity: Joi.number().min(0).max(100).required(),
      description: Joi.string().required(),
    }).optional(),
  }).optional(),
  analysis: Joi.object({
    plant: Joi.object({
      commonName: Joi.string().required(),
      scientificName: Joi.string().required(),
    }).required(),
    disease: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }).optional(),
    confidence: Joi.number().min(0).max(1).required(),
  }).optional(),
  products: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
      category: Joi.string().required(),
    })
  ).max(20).optional(),
});

/**
 * Validation schema for image analysis need check
 */
export const analyzeImageNeedSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().trim().min(1).max(4000).required(),
    })
  ).min(1).max(50).required(),
});

/**
 * Validation schema for product recommendation need check
 */
export const analyzeProductNeedSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().trim().min(1).max(4000).required(),
    })
  ).min(1).max(50).required(),
  analysis: Joi.object({
    plant: Joi.object({
      commonName: Joi.string().required(),
      scientificName: Joi.string().required(),
    }).required(),
    disease: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }).optional(),
    confidence: Joi.number().min(0).max(1).required(),
  }).optional(),
});

/**
 * Validation middleware for AI response generation
 */
export const validateGenerateResponse = (req, res, next) => {
  const { error, value } = generateResponseSchema.validate(req.body);
  
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
 * Validation middleware for image analysis need check
 */
export const validateAnalyzeImageNeed = (req, res, next) => {
  const { error, value } = analyzeImageNeedSchema.validate(req.body);
  
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
 * Validation middleware for product recommendation need check
 */
export const validateAnalyzeProductNeed = (req, res, next) => {
  const { error, value } = analyzeProductNeedSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.body = value;
  next();
};
