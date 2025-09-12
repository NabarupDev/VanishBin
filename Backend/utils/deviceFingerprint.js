const crypto = require('crypto');

/**
 * Generate a device fingerprint based on request headers and characteristics
 * This creates a unique identifier combining IP address with browser/device characteristics
 */
function generateDeviceFingerprint(req) {
  const components = [
    // IP address (primary identifier)
    req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
    
    // User agent (browser/device info)
    req.get('User-Agent') || 'unknown',
    
    // Accept language (user's language preference)
    req.get('Accept-Language') || 'unknown',
    
    // Accept encoding (compression support)
    req.get('Accept-Encoding') || 'unknown',
    
    // Connection info
    req.get('Connection') || 'unknown',
    
    // Additional headers that help identify unique devices
    req.get('DNT') || '', // Do Not Track
    req.get('Upgrade-Insecure-Requests') || '',
    req.get('Sec-Fetch-Site') || '',
    req.get('Sec-Fetch-Mode') || '',
    req.get('Sec-Fetch-Dest') || '',
    
    // Screen resolution if available (from custom header)
    req.get('X-Screen-Resolution') || '',
    
    // Timezone if available (from custom header)
    req.get('X-Timezone') || '',
  ];

  // Create a hash of all components
  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');

  return fingerprint;
}

/**
 * Get a combined key for rate limiting that includes both IP and device fingerprint
 */
function getRateLimitKey(req) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const fingerprint = generateDeviceFingerprint(req);
  
  // Use first 12 characters of fingerprint for brevity while maintaining uniqueness
  return `${ip}:${fingerprint.substring(0, 12)}`;
}

/**
 * Extract real IP address considering proxy headers
 */
function getRealIP(req) {
  return req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         req.get('X-Real-IP') ||
         req.get('CF-Connecting-IP') || // Cloudflare
         req.get('X-Client-IP') ||
         req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Enhanced key generator that handles proxies and CDNs properly
 */
function getEnhancedRateLimitKey(req) {
  const realIP = getRealIP(req);
  const fingerprint = generateDeviceFingerprint(req);
  
  return `${realIP}:${fingerprint.substring(0, 12)}`;
}

module.exports = {
  generateDeviceFingerprint,
  getRateLimitKey,
  getRealIP,
  getEnhancedRateLimitKey
};