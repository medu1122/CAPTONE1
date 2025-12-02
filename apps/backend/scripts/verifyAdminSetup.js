import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/modules/auth/auth.model.js';
import Post from '../src/modules/posts/post.model.js';
import Analysis from '../src/modules/analyses/analysis.model.js';
import AuthToken from '../src/modules/auth/authToken.model.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

/**
 * Verification script to check if all admin collections and indexes are properly set up
 * Run: node scripts/verifyAdminSetup.js
 */
async function verifyAdminSetup() {
  try {
    console.log('🔍 Verifying Admin Setup...\n');
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}\n`);

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    let allGood = true;

    // 1. Check required collections
    console.log('📋 Checking Collections...\n');
    const requiredCollections = ['users', 'posts', 'analyses', 'auth_tokens', 'complaints', 'reports'];
    
    requiredCollections.forEach(collectionName => {
      if (collectionNames.includes(collectionName)) {
        console.log(`   ✅ ${collectionName} collection exists`);
      } else {
        console.log(`   ❌ ${collectionName} collection MISSING`);
        allGood = false;
      }
    });

    // 2. Check Users collection fields and indexes
    console.log('\n👥 Checking Users Collection...\n');
    try {
      const userSample = await User.findOne();
      if (userSample) {
        const hasMutedUntil = userSample.schema.paths.mutedUntil !== undefined;
        const hasMuteReason = userSample.schema.paths.muteReason !== undefined;
        
        console.log(`   Fields:`);
        console.log(`     ${hasMutedUntil ? '✅' : '❌'} mutedUntil field`);
        console.log(`     ${hasMuteReason ? '✅' : '❌'} muteReason field`);
        
        if (!hasMutedUntil || !hasMuteReason) allGood = false;
      }

      const userIndexes = await User.collection.getIndexes();
      const requiredUserIndexes = [
        'role_1',
        'status_1',
        'isVerified_1',
        'role_1_status_1',
        'createdAt_1',
        'mutedUntil_1'
      ];

      console.log(`   Indexes:`);
      requiredUserIndexes.forEach(indexName => {
        const exists = userIndexes[indexName] !== undefined;
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking users: ${error.message}`);
      allGood = false;
    }

    // 3. Check Posts collection fields and indexes
    console.log('\n📝 Checking Posts Collection...\n');
    try {
      const postSample = await Post.findOne();
      if (postSample) {
        const hasReportCount = postSample.schema.paths.reportCount !== undefined;
        const hasLastReportedAt = postSample.schema.paths.lastReportedAt !== undefined;
        
        console.log(`   Fields:`);
        console.log(`     ${hasReportCount ? '✅' : '❌'} reportCount field`);
        console.log(`     ${hasLastReportedAt ? '✅' : '❌'} lastReportedAt field`);
        
        if (!hasReportCount || !hasLastReportedAt) allGood = false;
      }

      const postIndexes = await Post.collection.getIndexes();
      const requiredPostIndexes = [
        'createdAt_1',
        'reportCount_-1_createdAt_-1',
        'lastReportedAt_-1'
      ];

      console.log(`   Indexes:`);
      requiredPostIndexes.forEach(indexName => {
        const exists = postIndexes[indexName] !== undefined;
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking posts: ${error.message}`);
      allGood = false;
    }

    // 4. Check Analyses collection indexes
    console.log('\n🔬 Checking Analyses Collection...\n');
    try {
      const analysisIndexes = await Analysis.collection.getIndexes();
      const requiredAnalysisIndexes = [
        'createdAt_1',
        'source_1_createdAt_-1',
        'resultTop.plant.commonName_1'
      ];

      console.log(`   Indexes:`);
      requiredAnalysisIndexes.forEach(indexName => {
        const exists = analysisIndexes[indexName] !== undefined;
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking analyses: ${error.message}`);
      allGood = false;
    }

    // 5. Check Auth Tokens collection indexes
    console.log('\n🔑 Checking Auth Tokens Collection...\n');
    try {
      const authTokenIndexes = await AuthToken.collection.getIndexes();
      const requiredAuthTokenIndexes = [
        'expiresAt_1_createdAt_-1'
      ];

      console.log(`   Indexes:`);
      requiredAuthTokenIndexes.forEach(indexName => {
        const exists = authTokenIndexes[indexName] !== undefined;
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking auth tokens: ${error.message}`);
      allGood = false;
    }

    // 6. Check Complaints collection
    console.log('\n📋 Checking Complaints Collection...\n');
    try {
      const complaintsCount = await db.collection('complaints').countDocuments();
      console.log(`   Documents: ${complaintsCount}`);
      
      const complaintIndexes = await db.collection('complaints').indexes();
      const indexNames = complaintIndexes.map(idx => idx.name);
      
      const requiredComplaintIndexes = [
        'user_1_createdAt_-1',
        'status_1_createdAt_-1',
        'type_1_status_1',
        'relatedId_1_relatedType_1',
        'title_text_description_text'
      ];

      console.log(`   Indexes:`);
      requiredComplaintIndexes.forEach(indexName => {
        const exists = indexNames.includes(indexName);
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking complaints: ${error.message}`);
      allGood = false;
    }

    // 7. Check Reports collection
    console.log('\n🚩 Checking Reports Collection...\n');
    try {
      const reportsCount = await db.collection('reports').countDocuments();
      console.log(`   Documents: ${reportsCount}`);
      
      const reportIndexes = await db.collection('reports').indexes();
      const indexNames = reportIndexes.map(idx => idx.name);
      
      const requiredReportIndexes = [
        'user_1_createdAt_-1',
        'targetId_1_targetType_1',
        'status_1_createdAt_-1',
        'type_1_reason_1',
        'description_text'
      ];

      console.log(`   Indexes:`);
      requiredReportIndexes.forEach(indexName => {
        const exists = indexNames.includes(indexName);
        console.log(`     ${exists ? '✅' : '❌'} ${indexName}`);
        if (!exists) allGood = false;
      });
    } catch (error) {
      console.log(`   ⚠️  Error checking reports: ${error.message}`);
      allGood = false;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('✅ All checks passed! Admin setup is complete.\n');
    } else {
      console.log('❌ Some checks failed. Please run setupAdminCollections.js and migrateAdminFields.js\n');
    }
    console.log('='.repeat(50) + '\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully\n');
    process.exit(allGood ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during verification:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run verification
verifyAdminSetup();

