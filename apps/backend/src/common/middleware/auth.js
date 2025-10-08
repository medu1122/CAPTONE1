import jwt from 'jsonwebtoken';
import { httpError } from '../utils/http.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(httpError(401, 'Authentication required. Please provide a valid access token.'));
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    if (!accessToken) {
      return next(httpError(401, 'Access token is required'));
    }
    
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(httpError(401, 'Access token has expired. Please refresh your token.'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(httpError(401, 'Invalid access token'));
    }
    return next(httpError(401, 'Authentication failed'));
  }
};

export const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
          req.user = decoded;
        } catch (error) {
          // Token is invalid or expired, but we continue without user
          req.user = null;
        }
      } else {
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