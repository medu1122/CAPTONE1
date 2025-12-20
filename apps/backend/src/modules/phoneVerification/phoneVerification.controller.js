import { httpSuccess } from '../../common/utils/http.js';
import phoneVerificationService from './phoneVerification.service.js';

/**
 * Create phone verification OTP
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const createVerificationOTP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại là bắt buộc',
      });
    }
    
    const result = await phoneVerificationService.createVerificationOTP(userId, phone);
    
    const { statusCode, body } = httpSuccess(201, result.message, {
      phone: result.phone,
      expiresAt: result.expiresAt,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify phone using OTP
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const verifyPhone = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP là bắt buộc',
      });
    }
    
    const result = await phoneVerificationService.verifyPhone(userId, otp);
    
    const { statusCode, body } = httpSuccess(200, result.message, {
      user: result.user,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Check phone verification status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const checkPhoneVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await phoneVerificationService.checkPhoneVerificationStatus(userId);
    
    const { statusCode, body } = httpSuccess(200, 'Phone verification status retrieved', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification OTP
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const resendVerificationOTP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await phoneVerificationService.resendVerificationOTP(userId);
    
    const { statusCode, body } = httpSuccess(200, result.message, {
      phone: result.phone,
      expiresAt: result.expiresAt,
    });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  createVerificationOTP,
  verifyPhone,
  checkPhoneVerificationStatus,
  resendVerificationOTP,
};

