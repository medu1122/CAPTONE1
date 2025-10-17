import Joi from 'joi';

/**
 * Validation schema for main chat analyze request
 */
export const chatAnalyzeSchema = Joi.object({
  message: Joi.string().trim().min(1).max(4000).optional(),
  imageUrl: Joi.string().uri().optional(),
  weather: Joi.object({
    current: Joi.object({
      temperature: Joi.number().required(),
      humidity: Joi.number().min(0).max(100).required(),
      description: Joi.string().required(),
    }).optional(),
  }).optional(),
}).custom((value, helpers) => {
  // At least one of message or imageUrl must be provided
  if (!value.message && !value.imageUrl) {
    return helpers.error('custom.messageOrImageRequired');
  }
  return value;
}).messages({
  'custom.messageOrImageRequired': 'Either message or imageUrl is required',
});

/**
 * Validation schema for text-only chat request
 */
export const textOnlySchema = Joi.object({
  message: Joi.string().trim().min(1).max(4000).required(),
  weather: Joi.object({
    current: Joi.object({
      temperature: Joi.number().required(),
      humidity: Joi.number().min(0).max(100).required(),
      description: Joi.string().required(),
    }).optional(),
  }).optional(),
});

/**
 * Validation schema for image-only chat request
 */
export const imageOnlySchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
});

/**
 * Validation schema for image + text chat request
 */
export const imageTextSchema = Joi.object({
  message: Joi.string().trim().min(1).max(4000).required(),
  imageUrl: Joi.string().uri().required(),
  weather: Joi.object({
    current: Joi.object({
      temperature: Joi.number().required(),
      humidity: Joi.number().min(0).max(100).required(),
      description: Joi.string().required(),
    }).optional(),
  }).optional(),
});

/**
 * Validation middleware for main chat analyze
 */
export const validateChatAnalyze = (req, res, next) => {
  const { error, value } = chatAnalyzeSchema.validate(req.body);
  
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
 * Validation middleware for text-only chat
 */
export const validateTextOnly = (req, res, next) => {
  const { error, value } = textOnlySchema.validate(req.body);
  
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
 * Validation middleware for image-only chat
 */
export const validateImageOnly = (req, res, next) => {
  const { error, value } = imageOnlySchema.validate(req.body);
  
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
 * Validation middleware for image + text chat
 */
export const validateImageText = (req, res, next) => {
  const { error, value } = imageTextSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.body = value;
  next();
};
