const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Test Supabase integration
const { uploadFile, deleteFile, getPublicUrl, generateUniqueFileName } = require('./config/supabase');

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');

  try {
    // Check environment variables
    console.log('1. Checking environment variables...');
    const requiredVars = ['SUPABASE_URL'];
    const optionalVars = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      console.log('Please set these in your .env file:');
      missing.forEach(varName => {
        console.log(`${varName}=your_${varName.toLowerCase()}`);
      });
      return false;
    }

    // Check if we have at least one key
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    
    if (!hasServiceKey && !hasAnonKey) {
      console.error('❌ Missing Supabase keys. You need either:');
      console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (recommended)');
      console.log('  OR');
      console.log('  SUPABASE_ANON_KEY=your_anon_key');
      return false;
    }

    console.log('✅ Environment variables are set');
    console.log(`   Using: ${hasServiceKey ? 'Service Role Key (recommended)' : 'Anonymous Key'}`);
    
    if (!hasServiceKey) {
      console.log('⚠️  Consider using SERVICE_ROLE_KEY to avoid RLS issues');
    }
    console.log('');

    // Test file upload
    console.log('2. Testing file upload...');
    const testContent = 'This is a test file for Supabase integration.\nCreated at: ' + new Date().toISOString();
    const testBuffer = Buffer.from(testContent, 'utf8');
    const fileName = generateUniqueFileName('test-file.txt');
    
    console.log(`   Uploading test file: ${fileName}`);
    const { data: uploadData, error: uploadError } = await uploadFile(
      testBuffer,
      fileName,
      'text/plain'
    );

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
      // Provide specific help for common errors
      if (uploadError.message && uploadError.message.includes('row-level security')) {
        console.log('\n💡 RLS Error Fix:');
        console.log('   This is a Row Level Security (RLS) issue. Try one of these solutions:');
        console.log('   1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
        console.log('   2. Make your storage bucket public in Supabase dashboard');
        console.log('   3. Configure RLS policies for anonymous users');
        console.log('   See SUPABASE_RLS_FIX.md for detailed instructions');
      }
      
      return false;
    }
    console.log('✅ File uploaded successfully');
    console.log(`   Path: ${uploadData.path}`);

    // Test public URL
    console.log('\n3. Testing public URL generation...');
    const publicUrl = getPublicUrl(uploadData.path);
    console.log(`✅ Public URL generated: ${publicUrl}`);

    // Test file deletion
    console.log('\n4. Testing file deletion...');
    const { data: deleteData, error: deleteError } = await deleteFile(uploadData.path);

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return false;
    }
    console.log('✅ File deleted successfully\n');

    console.log('🎉 All Supabase tests passed! Your integration is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');

  const baseURL = `http://localhost:${process.env.PORT || 5000}`;

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseURL}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log(`   Status: ${health.status}`);
      console.log(`   Storage: ${health.storage}`);
    } else {
      console.log('❌ Health check failed');
      return false;
    }

    console.log('\n🎉 API endpoints are working correctly.');
    return true;

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 Make sure the server is running on port', process.env.PORT || 5000);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('=' .repeat(60));
  console.log('  SUPABASE INTEGRATION TEST SUITE');
  console.log('=' .repeat(60));

  const supabaseTest = await testSupabaseIntegration();
  
  if (supabaseTest) {
    console.log('\n' + '-'.repeat(60));
    await testAPIEndpoints();
  }

  console.log('\n' + '='.repeat(60));
  console.log(supabaseTest ? '✅ ALL TESTS COMPLETED' : '❌ TESTS FAILED');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testSupabaseIntegration,
  testAPIEndpoints,
  runTests
};
