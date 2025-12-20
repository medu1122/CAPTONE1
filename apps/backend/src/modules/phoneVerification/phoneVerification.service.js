import crypto from 'crypto';
import PhoneVerification from './phoneVerification.model.js';
import User from '../auth/auth.model.js';
import smsService from '../../common/services/smsService.js';
import { httpError } from '../../common/utils/http.js';

/**
 * Generate 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Normalize phone number
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.substring(3);
  }
  
  if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.substring(2);
  }
  
  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }
  
  if (!/^0[3|5|7|8|9][0-9]{8}$/.test(normalized)) {
    throw httpError(400, `Invalid Vietnamese phone number: ${phone}`);
  }
  
  return normalized;
};

/**
 * Create phone verification OTP for user
 * @param {string} userId - User ID
 * @param {string} phone - Phone number
 * @returns {Promise<object>} OTP and details
 */
export const createVerificationOTP = async (userId, phone) => {
  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);

    // Check if phone is already verified for another user
    const existingUser = await User.findOne({ 
      phone: normalizedPhone, 
      phoneVerified: true,
      _id: { $ne: userId }
    });
    if (existingUser) {
      throw httpError(400, 'Số điện thoại này đã được xác thực bởi tài khoản khác');
    }

    // Check if user already has this phone verified
    if (user.phone === normalizedPhone && user.phoneVerified) {
      throw httpError(400, 'Số điện thoại này đã được xác thực');
    }

    // Deactivate any existing OTPs for this user
    await PhoneVerification.updateMany(
      { user: userId, used: false },
      { used: true }
    );

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save verification record
    await PhoneVerification.create({
      user: userId,
      phone: normalizedPhone,
      otp,
      expiresAt,
      attempts: 0,
    });

    // Send OTP via SMS
    try {
      await smsService.sendOTP(normalizedPhone, otp);
      console.log(`✅ OTP sent to ${normalizedPhone}`);
    } catch (smsError) {
      console.error('❌ Failed to send OTP SMS:', smsError.message);
      // Don't throw error, OTP is still created and can be resent
    }

    return {
      message: 'OTP đã được gửi đến số điện thoại của bạn',
      phone: normalizedPhone,
      expiresAt,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to create verification OTP: ${error.message}`);
  }
};

/**
 * Verify phone using OTP
 * @param {string} userId - User ID
 * @param {string} otp - OTP code
 * @returns {Promise<object>} Verification result
 */
export const verifyPhone = async (userId, otp) => {
  try {
    // Find the verification record
    const verification = await PhoneVerification.findOne({
      user: userId,
      used: false,
      expiresAt: { $gt: new Date() },
    }).select('+otp'); // Include OTP field

    if (!verification) {
      throw httpError(400, 'OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu OTP mới.');
    }

    // Check attempts
    if (verification.attempts >= 5) {
      throw httpError(400, 'Đã vượt quá số lần thử. Vui lòng yêu cầu OTP mới.');
    }

    // Verify OTP
    if (verification.otp !== otp) {
      // Increment attempts
      verification.attempts += 1;
      await verification.save();
      
      const remainingAttempts = 5 - verification.attempts;
      throw httpError(400, `OTP không đúng. Còn ${remainingAttempts} lần thử.`);
    }

    // Mark OTP as used
    verification.used = true;
    await verification.save();

    // Update user phone and verification status
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    user.phone = verification.phone;
    user.phoneVerified = true;
    
    // If SMS notifications was enabled but phone wasn't verified, keep it disabled
    // User needs to explicitly enable it after verification
    if (user.settings.smsNotifications && !user.phoneVerified) {
      user.settings.smsNotifications = false;
    }
    
    await user.save();

    return {
      message: 'Số điện thoại đã được xác thực thành công',
      user: {
        id: user._id,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to verify phone: ${error.message}`);
  }
};

/**
 * Check phone verification status for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Verification status
 */
export const checkPhoneVerificationStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    return {
      phone: user.phone,
      phoneVerified: user.phoneVerified || false,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to check phone verification status');
  }
};

/**
 * Resend verification OTP
 * @param {string} userId - User ID
 * @returns {Promise<object>} New OTP details
 */
export const resendVerificationOTP = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Try to find pending verification record first (in case user is in the middle of verification)
    const pendingVerification = await PhoneVerification.findOne({
      user: userId,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }); // Get the most recent one

    let phoneToUse = null;

    if (pendingVerification) {
      // Use phone from pending verification record
      phoneToUse = pendingVerification.phone;
      console.log(`📱 [Resend OTP] Using phone from pending verification: ${phoneToUse}`);
    } else if (user.phone) {
      // Use phone from user profile
      phoneToUse = user.phone;
      console.log(`📱 [Resend OTP] Using phone from user profile: ${phoneToUse}`);
    } else {
      // Try to find recently used verification record (within last 30 minutes)
      // This handles the case where user verified OTP but phone wasn't saved to profile yet
      const recentVerification = await PhoneVerification.findOne({
        user: userId,
        used: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
      }).sort({ createdAt: -1 }); // Get the most recent one

      if (recentVerification) {
        phoneToUse = recentVerification.phone;
        console.log(`📱 [Resend OTP] Using phone from recent verification: ${phoneToUse}`);
      } else {
        // No phone available
        throw httpError(400, 'Không tìm thấy số điện thoại. Vui lòng thêm số điện thoại và yêu cầu OTP mới.');
      }
    }

    // Create new OTP with the found phone
    const result = await createVerificationOTP(userId, phoneToUse);
    
    return {
      message: 'OTP mới đã được gửi đến số điện thoại của bạn',
      phone: result.phone,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    throw error;
  }
};

export default {
  createVerificationOTP,
  verifyPhone,
  checkPhoneVerificationStatus,
  resendVerificationOTP,
};

