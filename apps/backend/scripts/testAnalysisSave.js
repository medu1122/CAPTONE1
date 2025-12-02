/**
 * Test script to check if analysis saving works
 * Run: node scripts/testAnalysisSave.js
 */

import mongoose from 'mongoose';
import Analysis from '../src/modules/analyses/analysis.model.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GreenGrow';

async function testAnalysisSave() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check total analyses
    const total = await Analysis.countDocuments({});
    console.log(`📊 Total analyses in DB: ${total}`);

    // Get latest analysis
    const latest = await Analysis.findOne({}).sort({ createdAt: -1 }).lean();
    if (latest) {
      console.log('📅 Latest analysis:', {
        id: latest._id,
        createdAt: latest.createdAt,
        dateStr: latest.createdAt.toISOString().split('T')[0],
        hasUser: !!latest.user,
        hasPlant: !!latest.resultTop?.plant?.commonName,
      });
    }

    // Test creating a new analysis
    console.log('\n🧪 Testing analysis creation...');
    const testAnalysis = new Analysis({
      user: null, // Anonymous
      source: 'plantid',
      inputImages: [{ url: 'https://test.com/image.jpg' }],
      resultTop: {
        plant: {
          commonName: 'Cà chua',
          scientificName: 'Solanum lycopersicum',
        },
        confidence: 0.85,
        summary: 'Test analysis',
      },
      raw: {
        plant: { commonName: 'Cà chua' },
        diseases: [{ name: 'Đốm lá', confidence: 0.7 }],
        isHealthy: false,
      },
    });

    await testAnalysis.save();
    console.log('✅ Test analysis created:', {
      id: testAnalysis._id,
      createdAt: testAnalysis.createdAt,
    });

    // Check today's analyses
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayCount = await Analysis.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    console.log(`\n📊 Analyses today (since ${startOfToday.toISOString()}): ${todayCount}`);

    // Clean up test analysis
    await Analysis.deleteOne({ _id: testAnalysis._id });
    console.log('🧹 Test analysis deleted');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAnalysisSave();

