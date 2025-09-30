import { RateLimiterMemory } from 'rate-limiter-flexible';
import { httpError } from '../utils/http.js';

const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of points
  duration: 1, // Per second
});

export const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    next(httpError(429, 'Too many requests, please try again later'));
  }
};

export default {
  rateLimitMiddleware,
};