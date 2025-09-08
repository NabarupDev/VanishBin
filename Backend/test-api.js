// Simple test file to verify API functionality
// Run with: node test-api.js (make sure server is running)

const fetch = require('node-fetch'); // You may need to install: npm install node-fetch

const API_BASE = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing TempShare API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Upload text
    console.log('\n2️⃣ Testing text upload...');
    const textResponse = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello! This is a test message from the API test script. 🚀'
      })
    });
    
    const textData = await textResponse.json();
    console.log('✅ Text uploaded:', textData.id);
    console.log('🔗 Share link:', textData.shareLink);

    // Test 3: Retrieve content
    console.log('\n3️⃣ Testing content retrieval...');
    const retrieveResponse = await fetch(`${API_BASE}/${textData.id}`);
    const retrievedData = await retrieveResponse.json();
    console.log('✅ Content retrieved:', retrievedData.text.substring(0, 50) + '...');

    console.log('\n🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
