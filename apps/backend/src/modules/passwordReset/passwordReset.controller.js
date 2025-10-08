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
    
    const { statusCode, body } = httpSuccess(200, 'If the email exists, a reset link has been sent', {
      resetToken: result.resetToken,
      expiresAt: result.expiresAt,
      userEmail: result.userEmail,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
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
