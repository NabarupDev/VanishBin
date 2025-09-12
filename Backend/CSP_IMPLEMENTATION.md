# Content Security Policy (CSP) Implementation

This document outlines the Content Security Policy implementation for VanishBin to reduce XSS (Cross-Site Scripting) risks.

## Overview

Content Security Policy (CSP) is a security feature that helps prevent XSS attacks by controlling which resources can be loaded and executed by a web page. This implementation includes:

1. **Backend API CSP Headers** - Express middleware that sets CSP headers for API responses
2. **Frontend Deployment CSP** - Headers configured in Netlify and Vercel deployment configs
3. **HTML Meta CSP** - Fallback CSP meta tags in the HTML document
4. **Strict File Serving CSP** - Extra restrictive CSP for file download endpoints

## Implementation Details

### 1. Backend CSP Middleware (`/middleware/security.js`)

#### General CSP Middleware (`cspMiddleware`)
Applied to all API endpoints, allows necessary functionality while blocking XSS vectors:

```javascript
// Key directives:
"default-src 'self'"                    // Only allow resources from same origin
"script-src 'self' 'unsafe-inline'"     // Allow same-origin and inline scripts
"style-src 'self' 'unsafe-inline'"      // Allow same-origin and inline styles
"img-src 'self' data: blob:"            // Allow images from self, data URIs, and blobs
"connect-src 'self'"                    // API calls only to same origin
"object-src 'none'"                     // Block all object/embed/applet tags
"frame-ancestors 'none'"                // Prevent framing (clickjacking protection)
```

#### Strict CSP Middleware (`strictCspMiddleware`)
Applied to file download endpoints (`/api/file/:id`), maximum restriction:

```javascript
// Key directives:
"default-src 'none'"          // Block everything by default
"script-src 'none'"           // No JavaScript execution
"style-src 'none'"            // No CSS
"img-src 'self' data: blob:"  // Only allow necessary image sources
"object-src 'none'"           // Block all objects
```

#### Additional Security Headers
Both middlewares also set:
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enable XSS filtering
- `X-Frame-Options: DENY` - Prevent framing
- `Referrer-Policy: same-origin` - Control referrer information
- `Permissions-Policy` - Restrict sensitive browser features

### 2. Frontend Deployment Configuration

#### Netlify (`netlify.toml`)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
    # Plus additional security headers
```

#### Vercel (`vercel.json`)
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
      }
    ]
  }
]
```

### 3. HTML Meta Tags (`index.html`)
Fallback CSP implementation if server headers are not configured:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; ...">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<!-- Additional security meta tags -->
```

## CSP Directives Explained

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default policy for all resource types |
| `script-src` | `'self' 'unsafe-inline'` | Allow same-origin scripts and inline JS (for Vite/React) |
| `style-src` | `'self' 'unsafe-inline'` | Allow same-origin CSS and inline styles |
| `img-src` | `'self' data: blob: https:` | Images from self, data URIs, blobs, and HTTPS |
| `connect-src` | `'self' https://backend-url` | API calls to self and backend |
| `font-src` | `'self' data:` | Fonts from self and data URIs |
| `media-src` | `'self' blob:` | Media files from self and blobs |
| `object-src` | `'none'` | Block all plugins/objects |
| `base-uri` | `'self'` | Restrict base element |
| `form-action` | `'self'` | Form submissions only to self |
| `frame-ancestors` | `'none'` | Prevent framing (clickjacking) |

## Production vs Development

### Production Mode
- Includes `upgrade-insecure-requests` directive
- Stricter enforcement
- HSTS headers enabled

### Development Mode
- More permissive for dev tools
- Allows `'unsafe-eval'` for development
- WebSocket connections allowed

## XSS Protection Mechanisms

1. **Script Execution Control**
   - Only allows scripts from same origin
   - Blocks inline event handlers
   - Prevents external script injection

2. **Style Injection Prevention**
   - Controls CSS sources
   - Prevents malicious style injection

3. **Resource Loading Restrictions**
   - Controls image, font, and media sources
   - Blocks unauthorized external resources

4. **Framing Protection**
   - Prevents clickjacking attacks
   - Blocks unauthorized framing

5. **Form Security**
   - Restricts form submission targets
   - Prevents CSRF via form hijacking

## Testing

Run the CSP test suite:
```bash
cd Backend
node test-csp.js
```

This tests:
- General CSP middleware functionality
- Strict CSP for file endpoints
- Security headers presence
- Production mode features

## Browser Compatibility

CSP is supported by all modern browsers:
- Chrome 25+
- Firefox 23+
- Safari 7+
- Edge 12+
- IE 10+ (partial support)

## Monitoring and Debugging

### CSP Violation Reporting
To enable CSP violation reporting, add to CSP header:
```
report-uri /api/csp-report
```

### Browser DevTools
- Check Console for CSP violations
- Network tab shows blocked resources
- Security tab shows CSP status

### Common Issues and Solutions

1. **Inline Scripts Blocked**
   - Solution: Move to external files or use nonces
   - Current: Using `'unsafe-inline'` for compatibility

2. **External Resources Blocked**
   - Solution: Add domains to appropriate directives
   - Example: Add CDN domains to `script-src`

3. **Dynamic Content Issues**
   - Solution: Use `'strict-dynamic'` with nonces
   - Current: Avoided for compatibility

## Maintenance

### Regular Updates
1. Review CSP directives quarterly
2. Monitor for new XSS vectors
3. Update browser compatibility
4. Test with security scanners

### Adding New Resources
When adding new external resources:
1. Update CSP directives
2. Test in all environments
3. Update documentation
4. Run CSP tests

## Security Benefits

This CSP implementation provides:

1. **XSS Prevention** - Blocks most XSS attack vectors
2. **Data Exfiltration Protection** - Limits where data can be sent
3. **Clickjacking Prevention** - Blocks framing attacks
4. **MIME Sniffing Protection** - Prevents content type confusion
5. **Mixed Content Protection** - Enforces HTTPS in production

## Compliance

This implementation helps meet:
- OWASP Top 10 security requirements
- PCI DSS compliance (if handling payment data)
- GDPR security requirements
- SOC 2 security controls

## Future Improvements

1. **Nonce-based CSP** - Replace `'unsafe-inline'` with nonces
2. **CSP Reporting** - Implement violation reporting endpoint
3. **Strict Dynamic** - Use strict-dynamic for better security
4. **Subresource Integrity** - Add SRI hashes for external resources