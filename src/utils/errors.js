/**
 * Error Handler
 * Centralized error handling and custom error classes.
 */

const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DB_ERROR: 'DB_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

class AppError extends Error {
  constructor(message, code = ErrorCodes.UNKNOWN_ERROR) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      timestamp: this.timestamp
    };
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, ErrorCodes.VALIDATION_ERROR);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, ErrorCodes.AUTH_REQUIRED);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, ErrorCodes.PERMISSION_DENIED);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, ErrorCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

const ErrorHandler = (() => {
  /**
   * Handle Supabase errors and convert to AppError
   * @param {object} supabaseError - Error from Supabase
   * @returns {AppError} Converted error
   */
  function handleSupabaseError(supabaseError) {
    if (!supabaseError) {
      return new AppError('Unknown database error', ErrorCodes.DB_ERROR);
    }

    const message = supabaseError.message || 'Database operation failed';

    switch (supabaseError.code) {
      case 'PGRST116':
        return new NotFoundError('Record');
      case '42501':
        return new AuthorizationError('Permission denied for this operation');
      default:
        return new AppError(message, ErrorCodes.DB_ERROR);
    }
  }

  /**
   * Log error to console with context
   * @param {Error} error - Error to log
   * @param {string} context - Where the error occurred
   */
  function log(error, context = '') {
    console.error(`[ERROR${context ? ` - ${context}` : ''}]`, {
      name: error.name,
      message: error.message,
      code: error.code || 'N/A',
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for error logging
   * @returns {Function} Wrapped function
   */
  function wrapAsync(fn, context = '') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        log(error, context);
        throw error;
      }
    };
  }

  return {
    ErrorCodes,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    handleSupabaseError,
    log,
    wrapAsync
  };
})();

if (typeof window !== 'undefined') {
  window.ErrorCodes = ErrorCodes;
  window.AppError = AppError;
  window.ValidationError = ValidationError;
  window.AuthenticationError = AuthenticationError;
  window.AuthorizationError = AuthorizationError;
  window.NotFoundError = NotFoundError;
  window.ErrorHandler = ErrorHandler;
}