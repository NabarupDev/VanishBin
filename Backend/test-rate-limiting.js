const express = require('express');
const request = require('supertest');
const crypto = require('crypto');

// Mock app for testing rate limiting
const app = express();

// Import rate limiting middleware
const { 
  createEnhancedRateLimit, 
  uploadRateLimit, 
  downloadRateLimit,
  getViolationStats 
} = require('./middleware/rateLimiting');

// Trust proxy for testing
app.set('trust proxy', 1);

// Test endpoints with different rate limits
app.get('/test-upload', uploadRateLimit, (req, res) => {
  res.json({ success: true, message: 'Upload endpoint reached' });
});

app.get('/test-download', downloadRateLimit, (req, res) => {
  res.json({ success: true, message: 'Download endpoint reached' });
});

app.get('/test-custom', createEnhancedRateLimit({ max: 3, windowMs: 10000 }), (req, res) => {
  res.json({ success: true, message: 'Custom rate limit endpoint reached' });
});

app.get('/stats', (req, res) => {
  res.json(getViolationStats());
});

/**
 * Test rate limiting functionality
 */
async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting Implementation...\n');

  try {
    // Test 1: Normal requests should pass
    console.log('Test 1: Normal requests');
    const normalResponse = await request(app)
      .get('/test-custom')
      .expect(200);
    console.log('✅ Normal request passed:', normalResponse.body.message);

    // Test 2: Test rate limit enforcement
    console.log('\nTest 2: Rate limit enforcement');
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        request(app)
          .get('/test-custom')
          .set('User-Agent', 'Test-Agent-1')
          .set('X-Forwarded-For', '192.168.1.1')
      );
    }

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    console.log(`✅ Successful requests: ${successCount}`);
    console.log(`🚫 Rate limited requests: ${rateLimitedCount}`);

    if (rateLimitedCount > 0) {
      console.log('✅ Rate limiting is working correctly');
      console.log('Rate limit response:', responses.find(r => r.status === 429).body);
    }

    // Test 3: Different device fingerprints should have separate limits
    console.log('\nTest 3: Device fingerprint separation');
    const device1Response = await request(app)
      .get('/test-custom')
      .set('User-Agent', 'Test-Agent-Device1')
      .set('X-Forwarded-For', '192.168.1.2')
      .set('Accept-Language', 'en-US')
      .expect(200);

    const device2Response = await request(app)
      .get('/test-custom')
      .set('User-Agent', 'Test-Agent-Device2')
      .set('X-Forwarded-For', '192.168.1.2')
      .set('Accept-Language', 'es-ES')
      .expect(200);

    console.log('✅ Different devices can make separate requests');

    // Test 4: Check violation stats
    console.log('\nTest 4: Violation statistics');
    const statsResponse = await request(app)
      .get('/stats')
      .expect(200);

    console.log('📊 Violation stats:', JSON.stringify(statsResponse.body, null, 2));

    // Test 5: Upload endpoint rate limiting
    console.log('\nTest 5: Upload endpoint rate limiting');
    const uploadRequests = [];
    for (let i = 0; i < 12; i++) {
      uploadRequests.push(
        request(app)
          .get('/test-upload')
          .set('User-Agent', 'Upload-Test-Agent')
          .set('X-Forwarded-For', '192.168.1.3')
      );
    }

    const uploadResponses = await Promise.all(uploadRequests);
    const uploadSuccessCount = uploadResponses.filter(r => r.status === 200).length;
    const uploadRateLimitedCount = uploadResponses.filter(r => r.status === 429).length;

    console.log(`✅ Upload successful requests: ${uploadSuccessCount}`);
    console.log(`🚫 Upload rate limited requests: ${uploadRateLimitedCount}`);

    console.log('\n🎉 Rate limiting tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Manual testing instructions
 */
function printManualTestingInstructions() {
  console.log('\n📋 Manual Testing Instructions:');
  console.log('================================');
  console.log('1. Start the server: npm start');
  console.log('2. Test upload rate limiting:');
  console.log('   curl -X POST http://localhost:5000/api/upload -d "text=test" (repeat 11+ times)');
  console.log('3. Test download rate limiting:');
  console.log('   curl http://localhost:5000/api/all (repeat 101+ times)');
  console.log('4. Test different IPs:');
  console.log('   curl -H "X-Forwarded-For: 1.1.1.1" http://localhost:5000/api/all');
  console.log('   curl -H "X-Forwarded-For: 2.2.2.2" http://localhost:5000/api/all');
  console.log('5. Check rate limit stats:');
  console.log('   curl http://localhost:5000/api/rate-limit/stats');
  console.log('6. Test health check:');
  console.log('   curl http://localhost:5000/health');
  console.log('\n💡 Rate Limits per 15 minutes:');
  console.log('   - Upload: 10 requests');
  console.log('   - Download: 100 requests');
  console.log('   - General API: 200 requests');
  console.log('   - Admin operations: 10 requests per hour');
  console.log('   - Global: 500 requests');
}

// Run tests if called directly
if (require.main === module) {
  // Install supertest if not available
  try {
    require('supertest');
    testRateLimiting().then(() => {
      printManualTestingInstructions();
    });
  } catch (error) {
    console.log('📦 Installing supertest for testing...');
    console.log('Run: npm install --save-dev supertest');
    console.log('Then run: node test-rate-limiting.js');
    printManualTestingInstructions();
  }
}

module.exports = { testRateLimiting };