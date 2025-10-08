import crypto from 'crypto';
import PasswordReset from './passwordReset.model.js';
import User from '../auth/auth.model.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Create password reset token for user
 * @param {string} email - User email
 * @returns {Promise<object>} Reset token and details
 */
export const createResetToken = async (email) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      throw httpError(200, 'If the email exists, a reset link has been sent');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw httpError(403, 'Account is blocked');
    }

    // Deactivate any existing reset tokens for this user
    await PasswordReset.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    // Generate new reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save reset record
    await PasswordReset.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      resetToken,
      expiresAt,
      userEmail: user.email,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to create reset token');
  }
};

/**
 * Validate password reset token
 * @param {string} resetToken - Reset token
 * @returns {Promise<object>} Token validation result
 */
export const validateResetToken = async (resetToken) => {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find the reset record
    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    if (!resetRecord) {
      throw httpError(400, 'Invalid or expired reset token');
    }

    // Check if user is still active
    if (!resetRecord.user.isActive()) {
      throw httpError(403, 'Account is blocked');
    }

    return {
      valid: true,
      user: {
        id: resetRecord.user._id,
        email: resetRecord.user.email,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to validate reset token');
  }
};

/**
 * Reset password using token
 * @param {string} resetToken - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Reset result
 */
export const resetPassword = async (resetToken, newPassword) => {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find the reset record
    const resetRecord = await PasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    if (!resetRecord) {
      throw httpError(400, 'Invalid or expired reset token');
    }

    // Check if user is still active
    if (!resetRecord.user.isActive()) {
      throw httpError(403, 'Account is blocked');
    }

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    // Update user password
    const user = resetRecord.user;
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    return {
      message: 'Password reset successfully',
      user: {
        id: user._id,
        email: user.email,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to reset password');
  }
};

/**
 * Check if user has pending reset tokens
 * @param {string} userId - User ID
 * @returns {Promise<object>} Pending reset status
 */
export const checkPendingResets = async (userId) => {
  try {
    const pendingResets = await PasswordReset.countDocuments({
      user: userId,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    return {
      hasPendingResets: pendingResets > 0,
      count: pendingResets,
    };
  } catch (error) {
    throw httpError(500, 'Failed to check pending resets');
  }
};

export default {
  createResetToken,
  validateResetToken,
  resetPassword,
  checkPendingResets,
};
