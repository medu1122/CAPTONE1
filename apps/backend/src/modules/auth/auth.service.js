import User from './auth.model.js';
import { httpError } from '../../common/utils/http.js';
import { generateToken } from '../../common/utils/jwt.js';

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
  
  // Create new user
  const user = await User.create(userData);
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

/**
 * Login user
 * @param {object} credentials - User credentials
 * @returns {object} User and token
 */
const loginUser = async (credentials) => {
  const { email, password } = credentials;
  
  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw httpError(401, 'Invalid credentials');
  }
  
  // Check if password matches
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw httpError(401, 'Invalid credentials');
  }
  
  // Generate token
  const token = generateToken({ id: user._id });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
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
    profileImage: user.profileImage,
  };
};

export default {
  createUser,
  loginUser,
  getUserProfile,
};
