const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');

const migrateExistingShares = async () => {
  try {
    await connectDB();

    console.log('🔄 Starting migration of existing shares...');

    // First, let's check if there are any shares without expiresAt field
    const sharesWithoutExpiresAt = await mongoose.connection.db.collection('shares').find({
      expiresAt: { $exists: false }
    }).toArray();

    console.log(`📋 Found ${sharesWithoutExpiresAt.length} shares without expiresAt field`);

    if (sharesWithoutExpiresAt.length > 0) {
      console.log('🔧 Updating shares to add expiresAt field...');
      
      for (const share of sharesWithoutExpiresAt) {
        const createdAt = new Date(share.createdAt);
        const expiresAt = new Date(createdAt.getTime() + 10800000); // 3 hours after creation
        
        await mongoose.connection.db.collection('shares').updateOne(
          { _id: share._id },
          { 
            $set: { expiresAt: expiresAt },
            $unset: { expires: "" } // Remove old expires field if it exists
          }
        );
        
        console.log(`✅ Updated share ${share._id}: expires at ${expiresAt.toISOString()}`);
      }
    }

    // Now check for any indexes that need to be updated
    console.log('🔍 Checking database indexes...');
    const indexes = await mongoose.connection.db.collection('shares').indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop old TTL index if it exists
    try {
      await mongoose.connection.db.collection('shares').dropIndex('createdAt_1');
      console.log('🗑️ Dropped old TTL index on createdAt');
    } catch (error) {
      console.log('ℹ️ Old TTL index on createdAt not found (this is normal)');
    }

    // Create new index on expiresAt (without TTL)
    try {
      await mongoose.connection.db.collection('shares').createIndex({ expiresAt: 1 });
      console.log('✅ Created index on expiresAt');
    } catch (error) {
      console.log('ℹ️ Index on expiresAt already exists');
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

migrateExistingShares();
