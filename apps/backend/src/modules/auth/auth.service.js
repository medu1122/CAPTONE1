import crypto from 'crypto';
import User from './auth.model.js';
import AuthToken from './authToken.model.js';
import EmailVerification from '../emailVerification/emailVerification.model.js';
import * as passwordChangeOTPService from '../passwordChange/passwordChangeOTP.service.js';
import emailService from '../../common/services/emailService.js';
import { httpError } from '../../common/utils/http.js';
import { generateAccessToken, generateRefreshToken, decodeToken } from '../../common/utils/jwt.js';

/**
 * Create a new user with email verification
 * @param {object} userData - User data
 * @returns {object} Created user
 */
const createUser = async (userData) => {
  const { email } = userData;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw httpError(400, 'User already exists');
  }
  
  // Create new user with passwordHash field and isVerified=false
  const userDataWithHash = {
    ...userData,
    passwordHash: userData.password,
    isVerified: false, // User needs to verify email
  };
  delete userDataWithHash.password;
  
  const user = await User.create(userDataWithHash);
  
  // Generate verification token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Set expiration time (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Save verification record
  await EmailVerification.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });
  
  // Send verification email
  try {
    await emailService.sendVerificationEmail(
      user.email,
      user.name,
      rawToken,
      user._id.toString()
    );
    console.log(`✅ Verification email sent to ${user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send verification email:', emailError.message);
    // Don't throw error, user is still created
  }
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    message: 'User created successfully. Please check your email for verification link.',
  };
};

/**
 * Login user
 * @param {object} credentials - User credentials
 * @param {string} userAgent - User agent string
 * @param {string} ip - User IP address
 * @returns {object} User, access token, and refresh token
 */
const loginUser = async (credentials, userAgent, ip) => {
  const { email, password } = credentials;
  
  // Check if user exists and is active
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw httpError(401, 'Invalid credentials');
  }
  
  // Check if user is active
  if (!user.isActive()) {
    throw httpError(403, 'Account is blocked');
  }
  
  // Check if password matches
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw httpError(401, 'Invalid credentials');
  }
  
  // Generate tokens
  const accessToken = generateAccessToken({ 
    id: user._id,
    email: user.email,
    role: user.role 
  });
  
  const refreshToken = generateRefreshToken({ 
    id: user._id,
    email: user.email,
    role: user.role 
  });
  
  // Hash refresh token for storage
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // Calculate expiration date
  const expiresAt = new Date();
  const refreshExpiresDays = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS) || 14;
  expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);
  
  // Store refresh token
  await AuthToken.create({
    user: user._id,
    refreshTokenHash,
    userAgent,
    ip,
    expiresAt,
  });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      profileImage: user.profileImage || null,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @param {string} userAgent - User agent string
 * @param {string} ip - User IP address
 * @returns {object} New access token and refresh token
 */
const refreshAccessToken = async (refreshToken, userAgent, ip) => {
  try {
    // Hash the provided refresh token
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Find the token in database
    const tokenDoc = await AuthToken.findOne({ 
      refreshTokenHash,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('user');
    
    if (!tokenDoc) {
      throw httpError(401, 'Invalid or expired refresh token');
    }
    
    const user = tokenDoc.user;
    
    // Check if user is still active
    if (!user.isActive()) {
      throw httpError(403, 'Account is blocked');
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken({ 
      id: user._id,
      email: user.email,
      role: user.role 
    });
    
    const newRefreshToken = generateRefreshToken({ 
      id: user._id,
      email: user.email,
      role: user.role 
    });
    
    // Hash new refresh token
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    
    // Calculate new expiration date
    const expiresAt = new Date();
    const refreshExpiresDays = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS) || 14;
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);
    
    // Delete old token and create new one
    await AuthToken.findByIdAndDelete(tokenDoc._id);
    
    await AuthToken.create({
      user: user._id,
      refreshTokenHash: newRefreshTokenHash,
      userAgent,
      ip,
      expiresAt,
    });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw httpError(401, 'Invalid or expired refresh token');
    }
    throw error;
  }
};

/**
 * Logout user (revoke refresh token)
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {object} Success message
 */
const logoutUser = async (refreshToken) => {
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  const result = await AuthToken.updateOne(
    { refreshTokenHash, isActive: true },
    { isActive: false }
  );
  
  if (result.matchedCount === 0) {
    throw httpError(404, 'Refresh token not found');
  }
  
  return { message: 'Logged out successfully' };
};

/**
 * Logout user from all devices
 * @param {string} userId - User ID
 * @returns {object} Success message
 */
const logoutAllDevices = async (userId) => {
  const result = await AuthToken.updateMany(
    { user: userId, isActive: true },
    { isActive: false }
  );
  
  return { 
    message: 'Logged out from all devices successfully',
    revokedTokens: result.modifiedCount
  };
};

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {object} User profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    // Profile fields
    phone: user.phone,
    phoneVerified: user.phoneVerified || false,
    bio: user.bio,
    location: user.location,
    // Settings
    settings: user.settings,
    // Stats
    stats: user.stats,
    // Timestamps
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Get public user profile (for viewing other users' profiles)
 * @param {string} userId - User ID to view
 * @param {string} viewerId - Current user ID (optional, for privacy checks)
 * @returns {object} Public user profile
 */
const getPublicUserProfile = async (userId, viewerId = null) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  // Check if user is active
  if (!user.isActive()) {
    throw httpError(404, 'User not found'); // Don't reveal if account is blocked
  }
  
  // Get privacy settings
  const privacy = user.settings?.privacy || {};
  const profileVisibility = privacy.profileVisibility || 'public';
  const showEmail = privacy.showEmail || false;
  const showPhone = privacy.showPhone || false;
  
  // Check if viewer can see this profile
  const isOwner = viewerId && viewerId.toString() === user._id.toString();
  const canViewPrivate = isOwner; // Only owner can view private profiles
  
  if (profileVisibility === 'private' && !canViewPrivate) {
    throw httpError(403, 'This profile is private');
  }
  
  // Build public profile data
  const publicProfile = {
    id: user._id,
    name: user.name,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    bio: user.bio,
    // Location (always show if profile is public)
    location: profileVisibility === 'public' ? user.location : null,
    // Stats (always show)
    stats: {
      totalPosts: user.stats?.totalPosts || 0,
      totalComments: user.stats?.totalComments || 0,
      totalLikes: user.stats?.totalLikes || 0,
      totalPlants: user.stats?.totalPlants || 0,
      joinDate: user.stats?.joinDate || null,
    },
    // Privacy settings (for display purposes)
    profileVisibility,
    // Email and phone (only if user allows or is owner)
    email: (showEmail || isOwner) ? user.email : null,
    phone: (showPhone || isOwner) ? user.phone : null,
    // Timestamps
    createdAt: user.createdAt,
  };
  
  return publicProfile;
};

/**
 * Verify email with token
 * @param {string} token - Raw verification token
 * @param {string} userId - User ID
 * @returns {object} Verification result
 */
const verifyEmail = async (token, userId) => {
  try {
    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find the verification record
    const verification = await EmailVerification.findOne({
      user: userId,
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

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError.message);
      // Don't throw error, verification is still successful
    }

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to verify email');
  }
};

/**
 * Upload profile image
 * @param {string} userId - User ID
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {object} Updated user profile with new image URL
 */
const uploadProfileImage = async (userId, imageBuffer) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  try {
    // Import cloudinary service
    const cloudinaryService = (await import('../../common/libs/cloudinary.js')).default;
    
    // Delete old image if exists
    if (user.profileImage) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profileImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        
        if (folder && publicId) {
          await cloudinaryService.deleteFile(`${folder}/${publicId}`);
        }
      } catch (deleteError) {
        // Ignore delete errors (image might not be in Cloudinary)
        console.warn('Failed to delete old profile image:', deleteError.message);
      }
    }
    
    // Upload new image
    const uploadResult = await cloudinaryService.uploadBuffer(
      imageBuffer,
      'profiles',
      {
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
        ],
      }
    );
    
    // Update user profile image
    user.profileImage = uploadResult.secure_url;
    await user.save();
    
    return getUserProfile(userId);
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to upload profile image: ${error.message}`);
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {object} Updated user profile
 */
const updateProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  // Allowed fields for update
  const allowedFields = [
    'name',
    'phone',
    'bio',
    'profileImage',
    'location',
    'settings',
  ];
  
  // Update allowed fields only
  allowedFields.forEach((field) => {
    if (profileData[field] !== undefined) {
      if (field === 'location' && typeof profileData[field] === 'object') {
        // Merge location object
        user.location = {
          ...user.location,
          ...profileData[field],
          coordinates: {
            ...user.location?.coordinates,
            ...profileData[field]?.coordinates,
          },
        };
      } else if (field === 'settings' && typeof profileData[field] === 'object') {
        // Merge settings object
        const newSettings = {
          ...user.settings,
          ...profileData[field],
          privacy: {
            ...user.settings?.privacy,
            ...profileData[field]?.privacy,
          },
        };
        
        // Validate SMS notifications: only allow if phone is verified
        if (newSettings.smsNotifications === true && !user.phoneVerified) {
          throw httpError(400, 'Không thể bật thông báo SMS. Vui lòng xác thực số điện thoại trước.');
        }
        
        // If phone is not verified, force SMS notifications to false
        if (!user.phoneVerified) {
          newSettings.smsNotifications = false;
        }
        
        user.settings = newSettings;
      } else {
        user[field] = profileData[field];
      }
    }
  });
  
  // Update lastActiveAt
  user.stats = user.stats || {};
  user.stats.lastActiveAt = new Date();
  
  await user.save();
  
  return getUserProfile(userId);
};

/**
 * Resend verification email
 * @param {string} email - User email
 * @returns {object} Resend result
 */
const resendVerificationEmail = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      throw httpError(200, 'If the email exists and is not verified, a verification email has been sent');
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw httpError(400, 'Email is already verified');
    }

    // Deactivate any existing verification tokens for this user
    await EmailVerification.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    // Generate new verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save new verification record
    await EmailVerification.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        user.name,
        rawToken,
        user._id.toString()
      );
      console.log(`✅ Verification email resent to ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError.message);
      throw httpError(500, 'Failed to send verification email');
    }

    return {
      message: 'Verification email sent successfully',
      email: user.email,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, 'Failed to resend verification email');
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} verificationToken - Verification token from OTP verification
 * @param {object} req - Express request object (optional)
 * @returns {object} Success message
 */
const changePassword = async (userId, currentPassword, newPassword, verificationToken, req = null) => {
  const user = await User.findById(userId).select('+passwordHash');
  
  if (!user) {
    throw httpError(404, 'User not found');
  }
  
  // Verify verification token (OTP must be verified first)
  if (!verificationToken) {
    throw httpError(400, 'Verification token is required. Please verify OTP first.');
  }
  
  try {
    await passwordChangeOTPService.validateVerificationToken(userId, verificationToken);
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(400, 'Invalid or expired verification token');
  }
  
  // Verify current password
  const isPasswordMatch = await user.comparePassword(currentPassword);
  if (!isPasswordMatch) {
    throw httpError(400, 'Current password is incorrect');
  }
  
  // Check if new password is different from current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw httpError(400, 'New password must be different from current password');
  }
  
  // Update password (will be hashed by pre-save middleware)
  user.passwordHash = newPassword;
  await user.save();
  
  // Mark verification token as used
  await passwordChangeOTPService.markVerificationTokenAsUsed(userId, verificationToken);
  
  // Send email notification
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.get('user-agent') || null;
    await emailService.sendPasswordChangeEmail(user.email, user.name, ipAddress, userAgent);
  } catch (emailError) {
    console.error('❌ Failed to send password change email:', emailError.message);
    // Don't throw error - password change is still successful
  }
  
  return {
    message: 'Password changed successfully',
  };
};

export default {
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getUserProfile,
  getPublicUserProfile,
  updateProfile,
  uploadProfileImage,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
};
