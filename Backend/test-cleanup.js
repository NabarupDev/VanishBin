const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');
const { cleanupExpiredShares, getCleanupStats } = require('./services/cleanupService');
const Share = require('./models/Share');

const testCleanup = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🔍 Getting cleanup statistics before cleanup...');
    const statsBefore = await getCleanupStats();
    console.log('Stats before cleanup:', statsBefore);

    console.log('\n📋 Listing all shares with their expiration status...');
    const allShares = await Share.find({}).select('title createdAt expiresAt supabaseFilePath');
    const now = new Date();
    
    allShares.forEach(share => {
      const isExpired = share.expiresAt < now;
      const timeUntilExpiry = share.expiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));
      
      console.log(`📄 ${share.title}:`);
      console.log(`   Created: ${share.createdAt.toISOString()}`);
      console.log(`   Expires: ${share.expiresAt.toISOString()}`);
      console.log(`   Status: ${isExpired ? '❌ EXPIRED' : `✅ Active (${minutesUntilExpiry} min remaining)`}`);
      console.log(`   Has file: ${share.supabaseFilePath ? '📁 Yes' : '❌ No'}`);
      console.log('');
    });

    console.log('\n🧹 Running cleanup...');
    const cleanupResult = await cleanupExpiredShares();
    console.log('Cleanup result:', cleanupResult);

    console.log('\n🔍 Getting cleanup statistics after cleanup...');
    const statsAfter = await getCleanupStats();
    console.log('Stats after cleanup:', statsAfter);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

// Run the test
testCleanup();
