import jwt from 'jsonwebtoken';
import { httpError } from '../utils/http.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(httpError(401, 'Authentication required'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    return next(httpError(401, 'Invalid or expired token'));
  }
};

export const authOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we continue without user
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Continue without user even if there's an error
    req.user = null;
    next();
  }
};

export default {
  authMiddleware,
  authOptional,
};