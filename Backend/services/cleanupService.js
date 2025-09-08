const mongoose = require('mongoose');
const Share = require('../models/Share');
const { deleteFile } = require('../config/supabase');

/**
 * Cleanup service for handling file deletion when documents expire
 * This handles the automatic cleanup of files from Supabase when MongoDB TTL expires documents
 */

/**
 * Manual cleanup function to remove expired shares and their associated files
 * This can be run periodically as a backup to TTL expiration
 */
const cleanupExpiredShares = async () => {
  try {
    console.log('🧹 Starting manual cleanup of expired shares...');
    
    const now = new Date();
    
    // Find expired shares using the expiresAt field
    const expiredShares = await Share.find({
      expiresAt: { $lt: now }
    });

    console.log(`📋 Found ${expiredShares.length} expired shares to clean up`);

    let deletedCount = 0;
    let fileDeletedCount = 0;
    let errors = [];

    for (const share of expiredShares) {
      try {
        // Delete file from Supabase if it exists
        if (share.supabaseFilePath) {
          const { error } = await deleteFile(share.supabaseFilePath);
          if (error) {
            console.error(`❌ Failed to delete file from Supabase: ${share.supabaseFilePath}`, error);
            errors.push(`File deletion failed for ${share.supabaseFilePath}: ${error.message}`);
          } else {
            console.log(`✅ Deleted file from Supabase: ${share.supabaseFilePath}`);
            fileDeletedCount++;
          }
        }

        // Delete the document from MongoDB
        await Share.findByIdAndDelete(share._id);
        deletedCount++;
        console.log(`🗑️ Deleted expired share: ${share._id} (${share.title})`);

      } catch (error) {
        console.error(`❌ Error deleting share ${share._id}:`, error);
        errors.push(`Share deletion failed for ${share._id}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      deletedShares: deletedCount,
      deletedFiles: fileDeletedCount,
      totalExpired: expiredShares.length,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    console.log('🧹 Cleanup completed:', result);
    return result;

  } catch (error) {
    console.error('❌ Error during cleanup process:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Clean up orphaned files in Supabase that don't have corresponding database records
 * This is useful for cleaning up files that might be left behind due to errors
 */
const cleanupOrphanedFiles = async () => {
  try {
    console.log('🔍 Starting cleanup of orphaned files...');
    
    // This would require listing all files in Supabase storage and comparing
    // with database records. For now, we'll just return a placeholder
    // as Supabase doesn't have a simple way to list all files without pagination
    
    console.log('⚠️ Orphaned file cleanup not implemented yet. This requires manual intervention.');
    return {
      success: true,
      message: 'Orphaned file cleanup requires manual implementation based on your specific needs',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error during orphaned file cleanup:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get cleanup statistics
 */
const getCleanupStats = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const [
      totalShares,
      recentShares,
      expiredShares,
      sharesWithFiles
    ] = await Promise.all([
      Share.countDocuments({}),
      Share.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Share.countDocuments({ expiresAt: { $lt: now } }),
      Share.countDocuments({ supabaseFilePath: { $ne: null } })
    ]);

    return {
      totalShares,
      recentShares, // Created in last hour
      expiredShares, // Should be cleaned up
      sharesWithFiles,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Schedule periodic cleanup (optional - can be used with cron jobs)
 */
const scheduleCleanup = (intervalMinutes = 60) => {
  console.log(`⏰ Scheduling cleanup to run every ${intervalMinutes} minutes`);
  
  return setInterval(async () => {
    console.log('🕐 Running scheduled cleanup...');
    await cleanupExpiredShares();
  }, intervalMinutes * 60 * 1000);
};

module.exports = {
  cleanupExpiredShares,
  cleanupOrphanedFiles,
  getCleanupStats,
  scheduleCleanup
};
