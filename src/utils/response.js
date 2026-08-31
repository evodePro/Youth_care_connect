/**
 * Response Formatter
 * Standardizes all API responses according to specification.
 * 
 * Success:  { status: "success", message: string, data: object }
 * Error:    { status: "error", message: string, errorCode: string }
 */

const ResponseFormatter = (() => {
  /**
   * Create a success response
   * @param {string} message - Human readable message
   * @param {any} data - Response data
   * @returns {object} Standardized success response
   */
  function success(message, data = null) {
    return {
      status: 'success',
      message,
      data
    };
  }

  /**
   * Create an error response
   * @param {string} message - Human readable error message
   * @param {string} errorCode - Machine readable error code
   * @returns {object} Standardized error response
   */
  function error(message, errorCode = 'UNKNOWN_ERROR') {
    return {
      status: 'error',
      message,
      errorCode
    };
  }

  /**
   * Wrap a repository result into standardized format
   * @param {object} result - Raw database result
   * @param {string} successMessage - Message on success
   * @param {string} errorCode - Error code on failure
   * @returns {object} Standardized response
   */
  function fromDatabase(result, successMessage, errorCode = 'DB_ERROR') {
    if (result.error) {
      return error(result.error.message || 'Database operation failed', errorCode);
    }
    return success(successMessage, result.data);
  }

  /**
   * Paginated response wrapper
   * @param {Array} items - Array of items
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {object} Standardized paginated response
   */
  function paginated(items, total, page, limit) {
    return {
      status: 'success',
      message: 'Data retrieved successfully',
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    };
  }

  return {
    success,
    error,
    fromDatabase,
    paginated
  };
})();

if (typeof window !== 'undefined') {
  window.ResponseFormatter = ResponseFormatter;
}