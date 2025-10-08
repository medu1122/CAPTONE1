import crypto from 'crypto';
import User from './auth.model.js';
import AuthToken from './authToken.model.js';
import { httpError } from '../../common/utils/http.js';
import { generateAccessToken, generateRefreshToken, decodeToken } from '../../common/utils/jwt.js';

/**
 * Create a new user
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
  
  // Create new user with passwordHash field
  const userDataWithHash = {
    ...userData,
    passwordHash: userData.password,
  };
  delete userDataWithHash.password;
  
  const user = await User.create(userDataWithHash);
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
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
    
    // Deactivate old token and create new one
    await AuthToken.findByIdAndUpdate(tokenDoc._id, { isActive: false });
    
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

export default {
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getUserProfile,
};
