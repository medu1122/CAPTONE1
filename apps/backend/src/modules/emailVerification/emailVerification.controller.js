import { httpSuccess } from '../../common/utils/http.js';
import emailVerificationService from './emailVerification.service.js';

/**
 * Create email verification token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const createVerificationToken = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await emailVerificationService.createVerificationToken(userId);
    
    const { statusCode, body } = httpSuccess(201, 'Verification token created successfully', {
      verificationToken: result.verificationToken,
      expiresAt: result.expiresAt,
      userEmail: result.userEmail,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email using token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.body;
    const result = await emailVerificationService.verifyEmail(verificationToken);
    
    const { statusCode, body } = httpSuccess(200, result.message, {
      user: result.user,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Check verification status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const checkVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await emailVerificationService.checkVerificationStatus(userId);
    
    const { statusCode, body } = httpSuccess(200, 'Verification status retrieved', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await emailVerificationService.resendVerificationEmail(userId);
    
    const { statusCode, body } = httpSuccess(200, result.message, {
      verificationToken: result.verificationToken,
      expiresAt: result.expiresAt,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  createVerificationToken,
  verifyEmail,
  checkVerificationStatus,
  resendVerificationEmail,
};
