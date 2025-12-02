import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/modules/complaints/complaint.model.js';
import Report from '../src/modules/reports/report.model.js';
import User from '../src/modules/auth/auth.model.js';
import Post from '../src/modules/posts/post.model.js';
import Analysis from '../src/modules/analyses/analysis.model.js';
import AuthToken from '../src/modules/auth/authToken.model.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

/**
 * Setup script to create collections and indexes for admin features
 * Run: node scripts/setupAdminCollections.js
 */
async function setupAdminCollections() {
  try {
    console.log('🔧 Setting up admin collections and indexes...\n');
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}\n`);

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // 1. Create complaints collection and indexes
    console.log('📋 Creating complaints collection...');
    try {
      await Complaint.createCollection();
      console.log('   ✅ Complaints collection created');
    } catch (error) {
      if (error.code === 48) {
        console.log('   ℹ️  Complaints collection already exists');
      } else {
        throw error;
      }
    }

    // Create indexes for complaints
    console.log('   Creating indexes for complaints...');
    await Complaint.collection.createIndex({ user: 1, createdAt: -1 });
    await Complaint.collection.createIndex({ status: 1, createdAt: -1 });
    await Complaint.collection.createIndex({ type: 1, status: 1 });
    await Complaint.collection.createIndex({ relatedId: 1, relatedType: 1 });
    await Complaint.collection.createIndex({ title: 'text', description: 'text' });
    console.log('   ✅ Complaints indexes created\n');

    // 2. Create reports collection and indexes
    console.log('📋 Creating reports collection...');
    try {
      await Report.createCollection();
      console.log('   ✅ Reports collection created');
    } catch (error) {
      if (error.code === 48) {
        console.log('   ℹ️  Reports collection already exists');
      } else {
        throw error;
      }
    }

    // Create indexes for reports
    console.log('   Creating indexes for reports...');
    await Report.collection.createIndex({ user: 1, createdAt: -1 });
    await Report.collection.createIndex({ targetId: 1, targetType: 1 });
    await Report.collection.createIndex({ status: 1, createdAt: -1 });
    await Report.collection.createIndex({ type: 1, reason: 1 });
    await Report.collection.createIndex({ description: 'text' });
    console.log('   ✅ Reports indexes created\n');

    // 3. Update users collection indexes
    console.log('👥 Updating users collection indexes...');
    try {
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ status: 1 });
      await User.collection.createIndex({ isVerified: 1 });
      await User.collection.createIndex({ role: 1, status: 1 });
      await User.collection.createIndex({ createdAt: 1 });
      await User.collection.createIndex({ mutedUntil: 1 });
      console.log('   ✅ Users indexes updated\n');
    } catch (error) {
      console.log('   ⚠️  Some users indexes may already exist:', error.message);
    }

    // 4. Update posts collection indexes
    console.log('📝 Updating posts collection indexes...');
    try {
      await Post.collection.createIndex({ createdAt: 1 });
      await Post.collection.createIndex({ reportCount: -1, createdAt: -1 });
      await Post.collection.createIndex({ lastReportedAt: -1 });
      console.log('   ✅ Posts indexes updated\n');
    } catch (error) {
      console.log('   ⚠️  Some posts indexes may already exist:', error.message);
    }

    // 5. Update analyses collection indexes
    console.log('🔬 Updating analyses collection indexes...');
    try {
      await Analysis.collection.createIndex({ createdAt: 1 });
      await Analysis.collection.createIndex({ source: 1, createdAt: -1 });
      await Analysis.collection.createIndex({ 'resultTop.plant.commonName': 1 });
      console.log('   ✅ Analyses indexes updated\n');
    } catch (error) {
      console.log('   ⚠️  Some analyses indexes may already exist:', error.message);
    }

    // 6. Update auth_tokens collection indexes
    console.log('🔑 Updating auth_tokens collection indexes...');
    try {
      await AuthToken.collection.createIndex({ expiresAt: 1, createdAt: -1 });
      console.log('   ✅ Auth tokens indexes updated\n');
    } catch (error) {
      console.log('   ⚠️  Auth tokens index may already exist:', error.message);
    }

    console.log('✅ All collections and indexes setup completed!\n');
    console.log('📊 Summary:');
    console.log('   - Complaints collection: ✅');
    console.log('   - Reports collection: ✅');
    console.log('   - Users indexes: ✅');
    console.log('   - Posts indexes: ✅');
    console.log('   - Analyses indexes: ✅');
    console.log('   - Auth tokens indexes: ✅\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run setup
setupAdminCollections();

