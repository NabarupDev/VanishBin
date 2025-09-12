/**
 * Error handling utilities for VanishBin Frontend
 */

// Error types for different scenarios
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  AUTH: 'AUTH',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT'
};

// Error messages for different scenarios
export const ErrorMessages = {
  [ErrorTypes.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorTypes.VALIDATION]: 'Invalid input. Please check your data and try again.',
  [ErrorTypes.UPLOAD]: 'Upload failed. Please try again.',
  [ErrorTypes.DOWNLOAD]: 'Download failed. Please try again.',
  [ErrorTypes.AUTH]: 'Authentication failed. Please check your password.',
  [ErrorTypes.NOT_FOUND]: 'Content not found or has expired.',
  [ErrorTypes.SERVER]: 'Server error. Please try again later.',
  [ErrorTypes.CLIENT]: 'Something went wrong. Please refresh the page.'
};

/**
 * Parse error from API response or JavaScript error
 */
export const parseError = (error) => {
  if (!error) return null;

  // Handle fetch/network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: ErrorTypes.NETWORK,
      message: ErrorMessages[ErrorTypes.NETWORK],
      originalError: error
    };
  }

  // Handle API response errors
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return {
          type: ErrorTypes.VALIDATION,
          message: error.response.data?.error || ErrorMessages[ErrorTypes.VALIDATION],
          originalError: error
        };
      case 401:
      case 403:
        return {
          type: ErrorTypes.AUTH,
          message: error.response.data?.error || ErrorMessages[ErrorTypes.AUTH],
          originalError: error
        };
      case 404:
        return {
          type: ErrorTypes.NOT_FOUND,
          message: error.response.data?.error || ErrorMessages[ErrorTypes.NOT_FOUND],
          originalError: error
        };
      case 429:
        return {
          type: ErrorTypes.SERVER,
          message: 'Too many requests. Please wait a moment and try again.',
          originalError: error
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorTypes.SERVER,
          message: ErrorMessages[ErrorTypes.SERVER],
          originalError: error
        };
      default:
        return {
          type: ErrorTypes.CLIENT,
          message: error.response.data?.error || ErrorMessages[ErrorTypes.CLIENT],
          originalError: error
        };
    }
  }

  // Handle JavaScript errors
  if (error instanceof Error) {
    return {
      type: ErrorTypes.CLIENT,
      message: error.message || ErrorMessages[ErrorTypes.CLIENT],
      originalError: error
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorTypes.CLIENT,
      message: error,
      originalError: error
    };
  }

  // Default error
  return {
    type: ErrorTypes.CLIENT,
    message: ErrorMessages[ErrorTypes.CLIENT],
    originalError: error
  };
};

/**
 * Enhanced fetch with error handling
 */
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response;
  } catch (error) {
    throw parseError(error);
  }
};

/**
 * Log error to console in development or to service in production
 */
export const logError = (error, context = {}) => {
  console.error('Error logged:', {
    ...parseError(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // In production, you might want to send this to an error tracking service
  // Example: Sentry.captureException(error, { contexts: { custom: context } });
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Create error notification object for UI display
 */
export const createErrorNotification = (error, options = {}) => {
  const parsedError = parseError(error);
  
  return {
    id: Date.now(),
    type: 'error',
    title: options.title || 'Error',
    message: parsedError.message,
    duration: options.duration || 5000,
    action: options.action || null,
    ...options
  };
};

export default {
  ErrorTypes,
  ErrorMessages,
  parseError,
  safeFetch,
  logError,
  retryWithBackoff,
  createErrorNotification
};