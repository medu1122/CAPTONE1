import Joi from 'joi';

/**
 * Validation schema for weather query parameters
 */
export const weatherQuerySchema = Joi.object({
  cityName: Joi.string().trim().min(1).max(100).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lon: Joi.number().min(-180).max(180).optional(),
}).custom((value, helpers) => {
  // At least one of cityName or lat/lon must be provided
  if (!value.cityName && (!value.lat || !value.lon)) {
    return helpers.error('custom.weatherLocationRequired');
  }
  return value;
}).messages({
  'custom.weatherLocationRequired': 'Either cityName or lat/lon coordinates are required',
});

/**
 * Validation schema for weather alerts query parameters
 */
export const weatherAlertsQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
});

/**
 * Validation middleware for weather endpoints
 */
export const validateWeatherQuery = (req, res, next) => {
  const { error, value } = weatherQuerySchema.validate(req.query);
  
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
 * Validation middleware for weather alerts endpoints
 */
export const validateWeatherAlertsQuery = (req, res, next) => {
  const { error, value } = weatherAlertsQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  
  req.query = value;
  next();
};
