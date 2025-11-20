import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTreatmentRecommendations } from '../src/modules/treatments/treatment.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Test keyword-based search improvement
 */
const testKeywordSearch = async () => {
  try {
    console.log('🧪 Testing Keyword-Based Search for Treatment Recommendations\n');
    console.log('='.repeat(70));

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test cases with different disease names
    const testCases = [
      {
        name: 'Test 1: Vietnamese disease name (GPT translated)',
        disease: 'Bệnh đốm lá cà chua',
        crop: 'Cà chua',
        expected: 'Should find products with "đốm lá" in targetDiseases'
      },
      {
        name: 'Test 2: English disease name (Plant.id original)',
        disease: 'Leaf Spot',
        crop: 'Tomato',
        expected: 'Should find products with "đốm lá" or "Leaf Spot"'
      },
      {
        name: 'Test 3: Powdery Mildew (Phấn trắng)',
        disease: 'Bệnh phấn trắng',
        crop: 'Cà chua',
        expected: 'Should find products with "phấn trắng"'
      },
      {
        name: 'Test 4: Downy Mildew (Mốc sương)',
        disease: 'Downy Mildew',
        crop: 'Corn',
        expected: 'Should find Apron® XL 350 ES'
      },
      {
        name: 'Test 5: Rust disease',
        disease: 'Bệnh rỉ sắt',
        crop: 'Lúa',
        expected: 'Should find products with "rỉ sắt"'
      },
      {
        name: 'Test 6: Complex disease name',
        disease: 'Bệnh mốc sương gây hại trên cây ngô',
        crop: 'Ngô',
        expected: 'Should extract keywords: mốc, sương, ngô'
      }
    ];

    for (const testCase of testCases) {
      console.log('\n' + '='.repeat(70));
      console.log(`📝 ${testCase.name}`);
      console.log(`   Disease: "${testCase.disease}"`);
      console.log(`   Crop: "${testCase.crop}"`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log('-'.repeat(70));

      const treatments = await getTreatmentRecommendations(
        testCase.disease,
        testCase.crop
      );

      if (treatments.length > 0) {
        console.log(`✅ Found ${treatments.length} treatment type(s):\n`);
        treatments.forEach((treatment, idx) => {
          console.log(`   ${idx + 1}. ${treatment.title} (${treatment.items.length} items)`);
          treatment.items.slice(0, 3).forEach(item => {
            console.log(`      - ${item.name}`);
            if (item.dosage) console.log(`        Dosage: ${item.dosage}`);
          });
          if (treatment.items.length > 3) {
            console.log(`      ... and ${treatment.items.length - 3} more`);
          }
        });
      } else {
        console.log('⚠️  No treatments found');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 Test completed!');
    console.log('='.repeat(70));

    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run test
testKeywordSearch();

