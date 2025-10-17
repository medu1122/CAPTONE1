import Joi from 'joi';

/**
 * Validation schema for product recommendations query
 */
export const recommendationsQuerySchema = Joi.object({
  plant: Joi.string().trim().min(1).max(100).required(),
  disease: Joi.string().trim().max(100).optional(),
  category: Joi.string().valid(
    'fertilizer',
    'pesticide', 
    'seed',
    'tool',
    'soil',
    'pot',
    'irrigation',
    'protection',
    'other'
  ).optional(),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

/**
 * Validation schema for product search query
 */
export const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(100).required(),
  category: Joi.string().valid(
    'fertilizer',
    'pesticide',
    'seed', 
    'tool',
    'soil',
    'pot',
    'irrigation',
    'protection',
    'other'
  ).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * Validation schema for product creation
 */
export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(1).max(1000).required(),
  category: Joi.string().valid(
    'fertilizer',
    'pesticide',
    'seed',
    'tool', 
    'soil',
    'pot',
    'irrigation',
    'protection',
    'other'
  ).required(),
  subcategory: Joi.string().trim().max(100).optional(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().valid('VND', 'USD').default('VND'),
  imageUrl: Joi.string().uri().required(),
  externalLinks: Joi.array().items(
    Joi.object({
      platform: Joi.string().valid('shopee', 'tiki', 'lazada', 'sendo', 'other').required(),
      url: Joi.string().uri().required(),
      price: Joi.number().min(0).optional(),
      availability: Joi.string().valid('in_stock', 'out_of_stock', 'limited').default('in_stock'),
    })
  ).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  plantTypes: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  diseaseTypes: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  usageInstructions: Joi.string().trim().max(2000).optional(),
  safetyNotes: Joi.string().trim().max(500).optional(),
});

/**
 * Validation middleware for recommendations endpoint
 */
export const validateRecommendationsQuery = (req, res, next) => {
  const { error, value } = recommendationsQuerySchema.validate(req.query);
  
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
 * Validation middleware for search endpoint
 */
export const validateSearchQuery = (req, res, next) => {
  const { error, value } = searchQuerySchema.validate(req.query);
  
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
 * Validation middleware for product creation
 */
export const validateCreateProduct = (req, res, next) => {
  const { error, value } = createProductSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.body = value;
  next();
};
