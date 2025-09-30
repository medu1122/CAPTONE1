/**
 * Creates a standardized success response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @returns {object} Success response object
 */
export const httpSuccess = (statusCode = 200, message = 'Success', data = null) => {
  return {
    statusCode,
    body: {
      success: true,
      message,
      data,
    },
  };
};

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Error object with status code
 */
export const httpError = (statusCode = 500, message = 'Internal Server Error') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
};