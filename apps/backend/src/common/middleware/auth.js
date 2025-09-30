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

export default {
  authMiddleware,
};