import jwt from 'jsonwebtoken';

/**
 * Generate access token (short-lived)
 * @param {object} payload - Data to be encoded in the token
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '1800'; // 30 minutes default
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${expiresIn}s` });
};

/**
 * Generate refresh token (long-lived)
 * @param {object} payload - Data to be encoded in the token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_DAYS || '14d';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate JWT token (legacy support)
 * @param {object} payload - Data to be encoded in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = '1d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Decode JWT token without verification (for expired tokens)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyToken,
  decodeToken,
};