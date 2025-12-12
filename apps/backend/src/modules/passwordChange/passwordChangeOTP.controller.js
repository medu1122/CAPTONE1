import { httpSuccess, httpError } from '../../common/utils/http.js';
import * as passwordChangeOTPService from './passwordChangeOTP.service.js';

/**
 * Generate and send OTP for password change
 */
export const generateOTP = async (req, res, next) => {
  try {
    const result = await passwordChangeOTPService.generateOTP(req.user.id);
    const { statusCode, body } = httpSuccess(200, result.message, {
      expiresAt: result.expiresAt,
      userEmail: result.userEmail,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP for password change
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return next(httpError(400, 'OTP is required'));
    }
    const result = await passwordChangeOTPService.verifyOTP(req.user.id, otp);
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
  generateOTP,
  verifyOTP,
};

