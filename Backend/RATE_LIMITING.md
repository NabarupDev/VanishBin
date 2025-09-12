# Rate Limiting Documentation

## Overview

This implementation provides comprehensive rate limiting for the VanishBin API using IP-based identification combined with device fingerprinting for enhanced security and abuse prevention.

## Features

### 🛡️ Advanced Device Fingerprinting
- **IP Address Detection**: Supports proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
- **Browser Fingerprinting**: Uses User-Agent, Accept-Language, Accept-Encoding
- **Security Headers**: Includes DNT, Sec-Fetch-* headers for unique identification
- **Custom Headers**: Supports X-Screen-Resolution and X-Timezone for enhanced uniqueness

### 📊 Multi-Tier Rate Limiting

#### Upload Endpoints (`POST /api/upload`)
- **Rate Limit**: 10 uploads per 15 minutes
- **Speed Limiting**: Delays start after 3 uploads (1-30 second delays)
- **Purpose**: Prevent file upload abuse and server overload

#### Download Endpoints (`GET /api/:id`, `GET /api/file/:id`)
- **Rate Limit**: 100 downloads per 15 minutes
- **Purpose**: Prevent excessive bandwidth usage

#### General API Endpoints (`GET /api/all`)
- **Rate Limit**: 200 requests per 15 minutes
- **Purpose**: Prevent API abuse for data scraping

#### Admin Endpoints (`GET /api/cleanup/stats`, `POST /api/cleanup`, `GET /api/rate-limit/stats`)
- **Rate Limit**: 10 requests per hour
- **Purpose**: Restrict administrative operations

#### Health Check (`GET /health`)
- **Rate Limit**: 60 requests per minute
- **Purpose**: Allow monitoring while preventing spam

#### Global Rate Limiting
- **Rate Limit**: 500 total requests per 15 minutes
- **Purpose**: Overall protection against abuse

## Implementation Details

### Device Fingerprinting Algorithm

```javascript
// Combines multiple request characteristics
const fingerprint = sha256(
  ip + "|" +
  userAgent + "|" +
  acceptLanguage + "|" +
  acceptEncoding + "|" +
  // ... additional headers
);

// Creates unique key: "192.168.1.1:a1b2c3d4e5f6"
const rateLimitKey = `${realIP}:${fingerprint.substring(0, 12)}`;
```

### Proxy Support

The system properly handles requests behind:
- Reverse proxies (nginx, Apache)
- CDNs (Cloudflare, CloudFront)
- Load balancers
- API gateways

### Response Format

When rate limit is exceeded:
```json
{
  "error": "Upload rate limit exceeded. You can upload 10 files per 15 minutes.",
  "retryAfter": 900,
  "timestamp": "2025-09-12T10:30:00.000Z"
}
```

## Endpoints

### Rate Limiting Statistics
```bash
GET /api/rate-limit/stats
```

Response:
```json
{
  "success": true,
  "rateLimitStats": {
    "activeViolations": 2,
    "totalViolations": 15,
    "violations": [
      {
        "deviceFingerprint": "192.168.1.1:a1b2c3d4e5f6",
        "violations": 8,
        "lastViolation": "2025-09-12T10:25:00.000Z"
      }
    ]
  },
  "timestamp": "2025-09-12T10:30:00.000Z"
}
```

## Testing

### Manual Testing

1. **Test Upload Rate Limiting**:
```bash
# Should succeed for first 10 requests
for i in {1..12}; do
  curl -X POST http://localhost:5000/api/upload \
    -H "Content-Type: application/json" \
    -d '{"text":"test'$i'"}'
done
```

2. **Test Different Devices**:
```bash
# Device 1
curl -H "User-Agent: Mozilla/5.0 (Device1)" \
     -H "Accept-Language: en-US" \
     http://localhost:5000/api/all

# Device 2 (different fingerprint)
curl -H "User-Agent: Chrome/96.0 (Device2)" \
     -H "Accept-Language: es-ES" \
     http://localhost:5000/api/all
```

3. **Test Proxy Headers**:
```bash
curl -H "X-Forwarded-For: 203.0.113.1" \
     -H "X-Real-IP: 203.0.113.1" \
     http://localhost:5000/api/all
```

4. **Check Statistics**:
```bash
curl http://localhost:5000/api/rate-limit/stats
```

### Automated Testing

Run the test suite:
```bash
node test-rate-limiting.js
```

## Configuration

### Custom Rate Limits

To create custom rate limits:

```javascript
const { createEnhancedRateLimit } = require('./middleware/rateLimiting');

const customLimit = createEnhancedRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 requests per window
  message: 'Custom rate limit exceeded',
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

app.use('/api/custom', customLimit);
```

### Environment Variables

```bash
# Enable/disable scheduled cleanup (affects admin endpoints)
ENABLE_SCHEDULED_CLEANUP=true

# Trusted proxy configuration
TRUST_PROXY=1

# Frontend URL for CORS (affects rate limiting headers)
FRONTEND_URL=https://vanishbin.vercel.app
```

## Security Considerations

### Benefits
- **Abuse Prevention**: Stops automated attacks and scraping
- **Resource Protection**: Prevents server overload
- **Fair Usage**: Ensures equal access for all users
- **DDoS Mitigation**: First line of defense against attacks

### Bypass Prevention
- **Device Fingerprinting**: Harder to circumvent than IP-only limiting
- **Multiple Headers**: Uses various request characteristics
- **Proxy Awareness**: Detects real IP behind proxies
- **Memory Storage**: Fast, efficient tracking

### Privacy
- **No Personal Data**: Only uses technical request headers
- **Hashed Fingerprints**: Uses SHA-256 for anonymization
- **Temporary Storage**: Violations expire automatically
- **No Logging**: Rate limit keys are not permanently stored

## Monitoring

### Health Check
The `/health` endpoint now includes rate limiting status:
```json
{
  "status": "OK",
  "rateLimiting": "Enabled",
  // ... other health data
}
```

### Violation Tracking
- Automatic cleanup of expired violations
- Statistics API for monitoring abuse patterns
- Real-time violation counting

## Troubleshooting

### Common Issues

1. **Rate Limit Too Strict**: Adjust limits in `middleware/rateLimiting.js`
2. **Proxy Issues**: Ensure `trust proxy` is configured correctly
3. **False Positives**: Check device fingerprinting in development
4. **Statistics Not Working**: Verify admin rate limits aren't exceeded

### Debug Mode

Enable detailed logging:
```javascript
// In middleware/rateLimiting.js
console.log(`Rate limit key: ${getEnhancedRateLimitKey(req)}`);
console.log(`Request headers:`, req.headers);
```

## Future Enhancements

- Redis storage for distributed systems
- Whitelist/blacklist functionality
- Adaptive rate limiting based on server load
- Integration with external threat intelligence
- Captcha challenges for violated users
- Rate limit bypass for authenticated premium users