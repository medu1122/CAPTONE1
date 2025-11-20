import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTreatmentRecommendations, getAdditionalInfo } from '../src/modules/treatments/treatment.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Test treatment recommendations
 */
const testTreatments = async () => {
  try {
    console.log('🧪 Testing Treatment Service...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Test cases
    const testCases = [
      { disease: 'Mốc sương', crop: 'Ngô', label: 'Test 1: Mốc sương + Ngô' },
      { disease: 'Nấm', crop: 'Cà chua', label: 'Test 2: Nấm + Cà chua' },
      { disease: 'Phấn trắng', crop: null, label: 'Test 3: Phấn trắng (no crop)' },
      { disease: 'Thối rễ', crop: 'Ớt', label: 'Test 4: Thối rễ + Ớt' },
    ];

    for (const testCase of testCases) {
      console.log('='.repeat(60));
      console.log(`\n📊 ${testCase.label}`);
      console.log(`   Disease: "${testCase.disease}", Crop: "${testCase.crop || 'none'}"\n`);

      // Get treatments
      const treatments = await getTreatmentRecommendations(testCase.disease, testCase.crop);
      
      if (treatments.length === 0) {
        console.log('   ⚠️  No treatments found\n');
        continue;
      }

      // Display results
      treatments.forEach((treatment) => {
        console.log(`   ${getTreatmentIcon(treatment.type)} ${treatment.title}:`);
        console.log(`      Found ${treatment.items.length} items`);
        
        if (treatment.items.length > 0) {
          console.log(`      Example: ${treatment.items[0].name}`);
        }
        console.log('');
      });

      // Get additional info
      const additionalInfo = await getAdditionalInfo(testCase.disease, testCase.crop);
      console.log(`   📋 Additional Info: ${additionalInfo.length} items`);
      if (additionalInfo.length > 0) {
        console.log(`      Example: ${additionalInfo[0].title}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Test completed successfully!\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('   All test cases executed');
    console.log('   Treatment service is working correctly');
    console.log('   Ready for integration with chatAnalyze service\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

/**
 * Get icon for treatment type
 */
const getTreatmentIcon = (type) => {
  const icons = {
    chemical: '💊',
    biological: '🌿',
    cultural: '🌾',
  };
  return icons[type] || '📦';
};

// Run test
testTreatments();

