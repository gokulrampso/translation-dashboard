/**
 * Async handler wrapper for Express routes
 * Catches errors and passes them to Express error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Standard API response format
 */
export const apiResponse = {
  success: (res, data, message = 'Success') => {
    return res.json({
      success: true,
      message,
      data,
    });
  },
  error: (res, message = 'Error', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error: details,
    });
  },
};

