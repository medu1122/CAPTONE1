import { httpSuccess } from '../../common/utils/http.js';
import authService from './auth.service.js';

/**
 * Register a new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.createUser(req.body);
    const { statusCode, body } = httpSuccess(201, 'User registered successfully', user);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.loginUser(req.body);
    const { statusCode, body } = httpSuccess(200, 'Login successful', { user, token });
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    const { statusCode, body } = httpSuccess(200, 'User profile retrieved', user);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getProfile,
};