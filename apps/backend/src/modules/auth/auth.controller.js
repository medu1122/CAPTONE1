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
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    const result = await authService.loginUser(req.body, userAgent, ip);
    const { statusCode, body } = httpSuccess(200, 'Login successful', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    const result = await authService.refreshAccessToken(refreshToken, userAgent, ip);
    const { statusCode, body } = httpSuccess(200, 'Token refreshed successfully', result);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (revoke refresh token)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logoutUser(refreshToken);
    const { statusCode, body } = httpSuccess(200, result.message);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user from all devices
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const logoutAll = async (req, res, next) => {
  try {
    const result = await authService.logoutAllDevices(req.user.id);
    const { statusCode, body } = httpSuccess(200, result.message, { 
      revokedTokens: result.revokedTokens 
    });
    
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
  refresh,
  logout,
  logoutAll,
  getProfile,
};