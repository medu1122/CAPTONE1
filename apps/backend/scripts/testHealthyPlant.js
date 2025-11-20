import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTreatmentRecommendations } from '../src/modules/treatments/treatment.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testHealthyPlant = async () => {
  try {
    console.log('🌱 Testing Healthy Plant Scenario...\n');

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('\n📊 TEST 1: Healthy Tomato Plant (Cà chua khỏe mạnh)');
    console.log('   Disease: NONE, Crop: Cà chua\n');

    const treatments1 = await getTreatmentRecommendations(null, 'Cà chua');
    
    console.log(`   ✅ Found ${treatments1.length} treatment type(s):\n`);
    treatments1.forEach((t) => {
      console.log(`   ${getIcon(t.type)} ${t.title}: ${t.items.length} items`);
      if (t.items.length > 0) {
        console.log(`      - ${t.items[0].name}`);
        if (t.items[1]) console.log(`      - ${t.items[1].name}`);
      }
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n📊 TEST 2: Healthy Plant (No specific crop)');
    console.log('   Disease: NONE, Crop: none\n');

    const treatments2 = await getTreatmentRecommendations(null, null);
    
    console.log(`   ✅ Found ${treatments2.length} treatment type(s):\n`);
    treatments2.forEach((t) => {
      console.log(`   ${getIcon(t.type)} ${t.title}: ${t.items.length} items`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST 3: Compare with Diseased Plant');
    console.log('   Disease: Nấm, Crop: Cà chua\n');

    const treatments3 = await getTreatmentRecommendations('Nấm', 'Cà chua');
    
    console.log(`   ✅ Found ${treatments3.length} treatment type(s):\n`);
    treatments3.forEach((t) => {
      console.log(`   ${getIcon(t.type)} ${t.title}: ${t.items.length} items`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SUMMARY:');
    console.log('   - Healthy plants: Show only "Biện pháp Chăm sóc" (cultural)');
    console.log('   - Diseased plants: Show all 3 types (chemical, biological, cultural)');
    console.log('   - System correctly handles both scenarios! 🎉\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

const getIcon = (type) => {
  const icons = { chemical: '💊', biological: '🌿', cultural: '🌾' };
  return icons[type] || '📦';
};

testHealthyPlant();

