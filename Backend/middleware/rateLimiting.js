const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { getEnhancedRateLimitKey } = require('../utils/deviceFingerprint');

// Store for tracking rate limit violations
const violationStore = new Map();

/**
 * Enhanced rate limiter that combines IP and device fingerprinting
 */
function createEnhancedRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // Default requests per window
    message = 'Too many requests from this device, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    standardHeaders = true,
    legacyHeaders = false,
    ...otherOptions
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req) => {
      // Use enhanced key that combines IP and device fingerprint
      return getEnhancedRateLimitKey(req);
    },
    handler: (req, res) => {
      const key = getEnhancedRateLimitKey(req);
      const now = Date.now();
      
      // Track violation
      violationStore.set(key, {
        timestamp: now,
        attempts: (violationStore.get(key)?.attempts || 0) + 1,
        windowMs
      });
      
      console.log(`Rate limit exceeded for device: ${key}`);
      
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    },
    ...otherOptions
  });
}

/**
 * Speed limiter that gradually slows down requests
 */
function createSpeedLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    delayAfter = 5, // Allow 5 requests at full speed
    delayMs = () => 500, // Delay each request by 500ms after delayAfter (new syntax)
    maxDelayMs = 10000, // Maximum delay of 10 seconds
    validate = { delayMs: false }, // Disable warning
    ...otherOptions
  } = options;

  return slowDown({
    windowMs,
    delayAfter,
    delayMs,
    maxDelayMs,
    validate,
    keyGenerator: (req) => {
      return getEnhancedRateLimitKey(req);
    },
    ...otherOptions
  });
}

// Different rate limit configurations for different endpoint types

/**
 * Strict rate limiting for upload endpoints (high resource usage)
 */
const uploadRateLimit = createEnhancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Upload rate limit exceeded. You can upload 10 files per 15 minutes.',
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

/**
 * Speed limiting for upload endpoints to prevent abuse
 */
const uploadSpeedLimit = createSpeedLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Start slowing after 3 uploads
  delayMs: () => 1000, // 1 second delay (new syntax)
  maxDelayMs: 30000 // Maximum 30 second delay
});

/**
 * Moderate rate limiting for download/view endpoints
 */
const downloadRateLimit = createEnhancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 downloads per 15 minutes
  message: 'Download rate limit exceeded. You can download 100 files per 15 minutes.',
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * General API rate limiting for other endpoints
 */
const generalApiRateLimit = createEnhancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: 'API rate limit exceeded. You can make 200 requests per 15 minutes.',
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * Strict rate limiting for cleanup endpoints (admin operations)
 */
const adminRateLimit = createEnhancedRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 admin operations per hour
  message: 'Admin operation rate limit exceeded. You can perform 10 operations per hour.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Very lenient rate limiting for health check
 */
const healthCheckRateLimit = createEnhancedRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 health checks per minute
  message: 'Health check rate limit exceeded.',
  skipSuccessfulRequests: true,
  skipFailedRequests: true
});

/**
 * Global rate limiting to prevent overall abuse
 */
const globalRateLimit = createEnhancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 total requests per 15 minutes
  message: 'Global rate limit exceeded. Please reduce your request frequency.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Get violation statistics for monitoring
 */
function getViolationStats() {
  const now = Date.now();
  const recent = [];
  const expired = [];
  
  for (const [key, data] of violationStore.entries()) {
    if (now - data.timestamp > data.windowMs) {
      expired.push(key);
    } else {
      recent.push({
        deviceFingerprint: key,
        violations: data.attempts,
        lastViolation: new Date(data.timestamp).toISOString()
      });
    }
  }
  
  // Clean up expired entries
  expired.forEach(key => violationStore.delete(key));
  
  return {
    activeViolations: recent.length,
    totalViolations: recent.reduce((sum, v) => sum + v.violations, 0),
    violations: recent.sort((a, b) => b.violations - a.violations)
  };
}

module.exports = {
  createEnhancedRateLimit,
  createSpeedLimit,
  uploadRateLimit,
  uploadSpeedLimit,
  downloadRateLimit,
  generalApiRateLimit,
  adminRateLimit,
  healthCheckRateLimit,
  globalRateLimit,
  getViolationStats
};