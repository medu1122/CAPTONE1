import Joi from 'joi';
import { httpError } from '../../common/utils/http.js';
import { ERROR_MESSAGES } from '../../common/constants.js';

/**
 * Validate plant analysis request
 * Requires either an image file or text query
 */
export const validateAnalyzeRequest = (req, res, next) => {
  // If there's a file uploaded, we can proceed
  if (req.file) {
    return next();
  }
  
  // If no file, check for text query (max 500 chars)
  const schema = Joi.object({
    text: Joi.string().trim().min(3).max(500).required().messages({
      'string.empty': ERROR_MESSAGES.REQUIRED_IMAGE_OR_TEXT,
      'string.min': 'Text query must be at least 3 characters long',
      'string.max': ERROR_MESSAGES.TEXT_TOO_LONG,
    }),
  });
  
  const { error } = schema.validate(req.body);
  if (error) {
    return next(httpError(400, error.details[0].message));
  }
  
  // If neither file nor text, return error
  if (!req.file && !req.body.text) {
    return next(httpError(400, ERROR_MESSAGES.REQUIRED_IMAGE_OR_TEXT));
  }
  
  next();
};