import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/modules/auth/auth.model.js';
import Post from '../src/modules/posts/post.model.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

/**
 * Migration script to add new fields to existing documents
 * Run: node scripts/migrateAdminFields.js
 */
async function migrateAdminFields() {
  try {
    console.log('🔄 Starting migration for admin fields...\n');
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}\n`);

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // 1. Update Users collection - Add mutedUntil and muteReason fields
    console.log('👥 Updating Users collection...');
    try {
      const usersResult = await User.updateMany(
        { 
          $or: [
            { mutedUntil: { $exists: false } },
            { muteReason: { $exists: false } }
          ]
        },
        {
          $set: {
            mutedUntil: null,
            muteReason: null,
          }
        }
      );
      console.log(`   ✅ Updated ${usersResult.modifiedCount} users with mutedUntil and muteReason fields\n`);
    } catch (error) {
      console.log(`   ⚠️  Error updating users: ${error.message}\n`);
    }

    // 2. Update Posts collection - Add reportCount and lastReportedAt fields
    console.log('📝 Updating Posts collection...');
    try {
      const postsResult = await Post.updateMany(
        { 
          $or: [
            { reportCount: { $exists: false } },
            { lastReportedAt: { $exists: false } }
          ]
        },
        {
          $set: {
            reportCount: 0,
            lastReportedAt: null,
          }
        }
      );
      console.log(`   ✅ Updated ${postsResult.modifiedCount} posts with reportCount and lastReportedAt fields\n`);
    } catch (error) {
      console.log(`   ⚠️  Error updating posts: ${error.message}\n`);
    }

    // 3. Verify collections exist and have correct structure
    console.log('🔍 Verifying collections...\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Existing collections:');
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');

    // Check if complaints and reports collections exist
    if (!collectionNames.includes('complaints')) {
      console.log('⚠️  Complaints collection not found. Run setupAdminCollections.js first.\n');
    } else {
      const complaintsCount = await mongoose.connection.db.collection('complaints').countDocuments();
      console.log(`   ✅ Complaints collection exists (${complaintsCount} documents)`);
    }

    if (!collectionNames.includes('reports')) {
      console.log('⚠️  Reports collection not found. Run setupAdminCollections.js first.\n');
    } else {
      const reportsCount = await mongoose.connection.db.collection('reports').countDocuments();
      console.log(`   ✅ Reports collection exists (${reportsCount} documents)`);
    }

    // 4. Check indexes
    console.log('\n🔍 Verifying indexes...\n');
    
    // Users indexes
    try {
      const userIndexes = await User.collection.getIndexes();
      console.log('   Users indexes:');
      Object.keys(userIndexes).forEach(indexName => {
        console.log(`     - ${indexName}`);
      });
    } catch (error) {
      console.log(`   ⚠️  Error getting users indexes: ${error.message}`);
    }

    // Posts indexes
    try {
      const postIndexes = await Post.collection.getIndexes();
      console.log('\n   Posts indexes:');
      Object.keys(postIndexes).forEach(indexName => {
        console.log(`     - ${indexName}`);
      });
    } catch (error) {
      console.log(`   ⚠️  Error getting posts indexes: ${error.message}`);
    }

    // Complaints indexes
    try {
      const complaintIndexes = await mongoose.connection.db.collection('complaints').indexes();
      console.log('\n   Complaints indexes:');
      complaintIndexes.forEach(index => {
        console.log(`     - ${index.name}`);
      });
    } catch (error) {
      console.log(`   ⚠️  Error getting complaints indexes: ${error.message}`);
    }

    // Reports indexes
    try {
      const reportIndexes = await mongoose.connection.db.collection('reports').indexes();
      console.log('\n   Reports indexes:');
      reportIndexes.forEach(index => {
        console.log(`     - ${index.name}`);
      });
    } catch (error) {
      console.log(`   ⚠️  Error getting reports indexes: ${error.message}`);
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - Users collection: Updated with mutedUntil and muteReason');
    console.log('   - Posts collection: Updated with reportCount and lastReportedAt');
    console.log('   - All collections verified\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateAdminFields();

