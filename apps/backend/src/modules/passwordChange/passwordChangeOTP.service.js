import crypto from 'crypto';
import PasswordChangeOTP from './passwordChangeOTP.model.js';
import PasswordChangeVerification from './passwordChangeVerification.model.js';
import User from '../auth/auth.model.js';
import { httpError } from '../../common/utils/http.js';
import emailService from '../../common/services/emailService.js';

/**
 * Generate and send OTP for password change
 * @param {string} userId - User ID
 * @returns {Promise<object>} OTP details (without actual OTP for security)
 */
export const generateOTP = async (userId) => {
  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw httpError(403, 'Account is blocked');
    }

    // Deactivate any existing OTPs for this user
    await PasswordChangeOTP.updateMany(
      { user: userId, used: false },
      { used: true }
    );

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save OTP record
    await PasswordChangeOTP.create({
      user: userId,
      otpHash,
      expiresAt,
    });

    // Send OTP email
    try {
      await emailService.sendPasswordChangeOTPEmail(
        user.email,
        user.name,
        otp
      );
      console.log(`✅ Password change OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password change OTP email:', emailError.message);
      // Delete the OTP record if email fails
      await PasswordChangeOTP.deleteOne({ user: userId, otpHash });
      throw httpError(500, 'Failed to send OTP email');
    }

    return {
      message: 'OTP sent successfully',
      expiresAt,
      userEmail: user.email,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to generate OTP');
  }
};

/**
 * Verify OTP for password change
 * @param {string} userId - User ID
 * @param {string} otp - OTP code
 * @returns {Promise<object>} Verification token
 */
export const verifyOTP = async (userId, otp) => {
  try {
    // Hash the provided OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find the OTP record
    const otpRecord = await PasswordChangeOTP.findOne({
      user: userId,
      otpHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw httpError(400, 'Invalid or expired OTP');
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Deactivate any existing verification tokens for this user
    await PasswordChangeVerification.updateMany(
      { user: userId, used: false },
      { used: true }
    );

    // Generate verification token for password change
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save verification token
    await PasswordChangeVerification.create({
      user: userId,
      tokenHash,
      expiresAt,
    });

    return {
      message: 'OTP verified successfully',
      verificationToken, // This will be used to authorize password change
      expiresAt,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to verify OTP');
  }
};

/**
 * Validate verification token for password change
 * @param {string} userId - User ID
 * @param {string} verificationToken - Verification token from verifyOTP
 * @returns {Promise<boolean>} True if valid
 */
export const validateVerificationToken = async (userId, verificationToken) => {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Find the verification record
    const verificationRecord = await PasswordChangeVerification.findOne({
      user: userId,
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      throw httpError(400, 'Verification token expired or invalid');
    }

    return true;
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to validate verification token');
  }
};

/**
 * Mark verification token as used after password change
 * @param {string} userId - User ID
 * @param {string} verificationToken - Verification token
 * @returns {Promise<void>}
 */
export const markVerificationTokenAsUsed = async (userId, verificationToken) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await PasswordChangeVerification.updateOne(
      { user: userId, tokenHash, used: false },
      { used: true }
    );
  } catch (error) {
    console.error('Failed to mark verification token as used:', error);
    // Don't throw error - password change is still successful
  }
};

