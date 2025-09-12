/**
 * Test script to verify CSP headers are working correctly
 */

const http = require('http');
const { cspMiddleware, strictCspMiddleware } = require('./middleware/security');

// Mock response object for testing
const createMockResponse = () => {
  const headers = {};
  return {
    headers,
    setHeader: (name, value) => {
      headers[name.toLowerCase()] = value;
    },
    getHeader: (name) => headers[name.toLowerCase()],
    getHeaders: () => headers
  };
};

// Mock request object
const createMockRequest = () => ({
  url: '/test',
  method: 'GET'
});

// Test function
const testCSPHeaders = () => {
  console.log('🧪 Testing CSP Headers Implementation...\n');
  
  try {
    // Test general CSP middleware
    console.log('1. Testing general CSP middleware:');
    const req1 = createMockRequest();
    const res1 = createMockResponse();
    
    cspMiddleware(req1, res1, () => {});
    
    const headers1 = res1.getHeaders();
    const cspHeader = headers1['content-security-policy'];
    
    console.log('   CSP Header:', cspHeader);
    
    const expectedDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "object-src 'none'",
      "frame-ancestors 'none'"
    ];
    
    let allDirectivesPresent = true;
    expectedDirectives.forEach(directive => {
      if (!cspHeader.includes(directive)) {
        console.log(`   ❌ Missing directive: ${directive}`);
        allDirectivesPresent = false;
      } else {
        console.log(`   ✅ Found directive: ${directive}`);
      }
    });
    
    // Test additional security headers
    console.log('\n   Additional Security Headers:');
    const expectedSecurityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'x-frame-options': 'DENY',
      'referrer-policy': 'same-origin'
    };
    
    Object.entries(expectedSecurityHeaders).forEach(([header, expectedValue]) => {
      const actualValue = headers1[header];
      if (actualValue === expectedValue) {
        console.log(`   ✅ ${header}: ${actualValue}`);
      } else {
        console.log(`   ❌ ${header}: expected "${expectedValue}", got "${actualValue}"`);
        allDirectivesPresent = false;
      }
    });
    
    // Test strict CSP middleware
    console.log('\n2. Testing strict CSP middleware:');
    const req2 = createMockRequest();
    const res2 = createMockResponse();
    
    strictCspMiddleware(req2, res2, () => {});
    
    const headers2 = res2.getHeaders();
    const strictCspHeader = headers2['content-security-policy'];
    
    console.log('   Strict CSP Header:', strictCspHeader);
    
    const strictDirectives = [
      "default-src 'none'",
      "script-src 'none'",
      "style-src 'none'",
      "object-src 'none'"
    ];
    
    strictDirectives.forEach(directive => {
      if (!strictCspHeader.includes(directive)) {
        console.log(`   ❌ Missing strict directive: ${directive}`);
        allDirectivesPresent = false;
      } else {
        console.log(`   ✅ Found strict directive: ${directive}`);
      }
    });
    
    // Test production mode CSP (with upgrade-insecure-requests)
    console.log('\n3. Testing production CSP:');
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const req3 = createMockRequest();
    const res3 = createMockResponse();
    
    cspMiddleware(req3, res3, () => {});
    
    const prodCspHeader = res3.getHeaders()['content-security-policy'];
    if (prodCspHeader.includes('upgrade-insecure-requests')) {
      console.log('   ✅ Production CSP includes upgrade-insecure-requests');
    } else {
      console.log('   ❌ Production CSP missing upgrade-insecure-requests');
      allDirectivesPresent = false;
    }
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
    
    if (allDirectivesPresent) {
      console.log('\n✅ All CSP Headers tests passed successfully!');
      return true;
    } else {
      console.log('\n❌ Some CSP Headers tests failed!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ CSP Headers test failed:', error.message);
    throw error;
  }
};

// Export for potential use in other tests
module.exports = { testCSPHeaders };

// Run the test if this file is executed directly
if (require.main === module) {
  try {
    const success = testCSPHeaders();
    if (success) {
      console.log('\n🎉 All CSP tests passed!');
      process.exit(0);
    } else {
      console.log('\n💥 Some CSP tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 CSP tests failed:', error);
    process.exit(1);
  }
}