import { httpError } from '../../common/utils/http.js';
import { analyzeService } from './analyze.service.js';
import { ERROR_MESSAGES } from '../../common/constants.js';

/**
 * Analyze plant (main endpoint)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const analyzePlant = async (req, res, next) => {
  try {
    // Check if both image and text are missing
    if (!req.file && !req.body.text) {
      return next(httpError(400, ERROR_MESSAGES.REQUIRED_IMAGE_OR_TEXT));
    }
    
    let imageUrl = null;
    
    // If file is provided, create data URL for testing
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imageUrl = `data:${mimeType};base64,${base64}`;
    }
    
    // Call analyze service with text and imageUrl
    const result = await analyzeService({
      text: req.body.text,
      imageUrl: imageUrl
    });
    
    // Return AnalysisResult directly (no wrapping)
    res.json(result);
    
  } catch (error) {
    next(error);
  }
};