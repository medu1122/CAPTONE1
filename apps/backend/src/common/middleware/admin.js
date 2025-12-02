import { httpError } from '../utils/http.js';
import { authMiddleware } from './auth.js';
import User from '../../modules/auth/auth.model.js';

/**
 * Admin middleware - Checks if user is authenticated and has admin role
 * Must be used after authMiddleware
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // First check authentication
    if (!req.user || !req.user.id) {
      return next(httpError(401, 'Authentication required'));
    }

    // Check if user exists and has admin role
    const user = await User.findById(req.user.id).select('role status');
    
    if (!user) {
      return next(httpError(404, 'User not found'));
    }

    if (user.role !== 'admin') {
      return next(httpError(403, 'Admin access required'));
    }

    if (user.status !== 'active') {
      return next(httpError(403, 'Admin account is not active'));
    }

    // Attach user object to request
    req.admin = user;
    
    next();
  } catch (error) {
    return next(httpError(500, 'Admin verification failed'));
  }
};

/**
 * Combined middleware: auth + admin check
 */
export const requireAdmin = [authMiddleware, adminMiddleware];

export default {
  adminMiddleware,
  requireAdmin,
};

