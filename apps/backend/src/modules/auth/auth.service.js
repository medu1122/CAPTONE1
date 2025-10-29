import crypto from 'crypto';
import User from './auth.model.js';
import AuthToken from './authToken.model.js';
import EmailVerification from '../emailVerification/emailVerification.model.js';
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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

export default {
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getUserProfile,
  verifyEmail,
  resendVerificationEmail,
};
