import crypto from 'crypto';
import EmailVerification from './emailVerification.model.js';
import User from '../auth/auth.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create email verification token for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Verification token and details
 */
export const createVerificationToken = async (userId) => {
  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw httpError(400, 'Email is already verified');
    }

    // Deactivate any existing verification tokens for this user
    await EmailVerification.updateMany(
      { user: userId, used: false },
      { used: true }
    );

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save verification record
    await EmailVerification.create({
      user: userId,
      tokenHash,
      expiresAt,
    });

    return {
      verificationToken,
      expiresAt,
      userEmail: user.email,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to create verification token');
  }
};

/**
 * Verify email using verification token
 * @param {string} verificationToken - Verification token
 * @returns {Promise<object>} Verification result
 */
export const verifyEmail = async (verificationToken) => {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Find the verification record
    const verification = await EmailVerification.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    if (!verification) {
      throw httpError(400, 'Invalid or expired verification token');
    }

    // Mark token as used
    verification.used = true;
    await verification.save();

    // Update user verification status
    const user = verification.user;
    user.isVerified = true;
    await user.save();

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to verify email');
  }
};

/**
 * Check verification status for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Verification status
 */
export const checkVerificationStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    return {
      isVerified: user.isVerified,
      email: user.email,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to check verification status');
  }
};

/**
 * Resend verification email
 * @param {string} userId - User ID
 * @returns {Promise<object>} New verification token
 */
export const resendVerificationEmail = async (userId) => {
  try {
    // Create new verification token
    const result = await createVerificationToken(userId);
    
    return {
      message: 'Verification email sent successfully',
      verificationToken: result.verificationToken,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    throw error;
  }
};

export default {
  createVerificationToken,
  verifyEmail,
  checkVerificationStatus,
  resendVerificationEmail,
};
