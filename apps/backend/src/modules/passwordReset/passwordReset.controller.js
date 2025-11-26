import { httpSuccess } from '../../common/utils/http.js';
import passwordResetService from './passwordReset.service.js';

/**
 * Request password reset
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await passwordResetService.createResetToken(email);
    
    // Don't return resetToken in response for security (it's sent via email)
    // Only return success message
    const { statusCode, body } = httpSuccess(200, 'If the email exists, a reset link has been sent', {
      // resetToken removed for security - only sent via email
      expiresAt: result.expiresAt,
      // userEmail removed for security - don't reveal if email exists
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    // Handle the special case where user doesn't exist (returns 200 for security)
    if (error.statusCode === 200) {
      const { statusCode, body } = httpSuccess(200, error.message, {});
      return res.status(statusCode).json(body);
    }
    next(error);
  }
};

/**
 * Validate reset token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const validateResetToken = async (req, res, next) => {
  try {
    const { resetToken } = req.body;
    const result = await passwordResetService.validateResetToken(resetToken);
    
    const { statusCode, body } = httpSuccess(200, 'Reset token is valid', {
      user: result.user,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await passwordResetService.resetPassword(resetToken, newPassword);
    
    const { statusCode, body } = httpSuccess(200, result.message, {
      user: result.user,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Check pending reset tokens
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const checkPendingResets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await passwordResetService.checkPendingResets(userId);
    
    const { statusCode, body } = httpSuccess(200, 'Pending resets status retrieved', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  checkPendingResets,
};
