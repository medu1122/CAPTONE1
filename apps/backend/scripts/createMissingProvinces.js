import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProvinceAgriculture from '../src/modules/provinces/province.model.js';
import { vietnamProvinces } from '../src/modules/provinces/vietnamProvinces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mapping giữa SVG ID và Province Code
const provinceIdMapping = {
  "VNHN": "HN", "VNSG": "HCM", "VNHP": "HP", "VNDN": "DN", "VNCT": "CT",
  "VN01": "LB", "VN02": "LC", "VN03": "HG", "VN04": "CB", "VN05": "SL",
  "VN06": "YB", "VN07": "TQ", "VN09": "LS", "VN13": "QN", "VN14": "HB",
  "VN18": "NB", "VN20": "TB", "VN21": "TH", "VN22": "NA", "VN23": "HT",
  "VN24": "QB", "VN25": "QT", "VN26": "HU", "VN27": "QNA", "VN29": "QG",
  "VN30": "GL", "VN31": "BD", "VN32": "PY", "VN33": "DL", "VN34": "KH",
  "VN35": "LD", "VN36": "NT", "VN37": "TN", "VN40": "BU", "VN41": "LA",
  "VN43": "BR-VT", "VN44": "AG", "VN45": "DT", "VN46": "TG", "VN47": "KG",
  "VN49": "VL", "VN50": "BT", "VN51": "TV", "VN52": "ST", "VN54": "BG",
  "VN55": "BL", "VN56": "BN", "VN58": "BP", "VN59": "CM", "VN61": "HD",
  "VN63": "HNA", "VN67": "ND", "VN68": "PT", "VN69": "TY", "VN70": "VP",
  "VN71": "DB", "VN72": "DG"
};

const getSvgIdByProvinceCode = (code) => {
  return Object.entries(provinceIdMapping).find(
    ([_, provinceCode]) => provinceCode === code
  )?.[0];
};

/**
 * Create missing provinces with empty data
 */
const createMissingProvinces = async () => {
  try {
    console.log('🚀 Creating missing provinces...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all existing provinces
    const existingProvinces = await ProvinceAgriculture.find({}, 'provinceCode');
    const existingCodes = new Set(existingProvinces.map(p => p.provinceCode));

    // Find missing provinces
    const missingProvinces = vietnamProvinces.filter(
      p => !existingCodes.has(p.code)
    );

    if (missingProvinces.length === 0) {
      console.log('✅ All provinces already exist in database!');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📊 Found ${missingProvinces.length} missing provinces:\n`);

    let created = 0;

    // Create missing provinces
    for (const province of missingProvinces) {
      try {
        const svgId = getSvgIdByProvinceCode(province.code);

        const provinceData = {
          provinceCode: province.code,
          simpleMapsId: svgId || undefined,
          provinceName: province.name,
          soilTypes: [], // Empty for now, will be filled later
          cropCalendar: [],
          articles: [],
          source: 'Manual entry - awaiting GeoJSON data',
        };

        await ProvinceAgriculture.create(provinceData);
        created++;
        console.log(`  ✅ Created: ${province.name} (${province.code})`);
      } catch (error) {
        console.error(`  ❌ Error creating ${province.code}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Creation completed!`);
    console.log(`   ✅ Created: ${created} provinces`);
    console.log('='.repeat(50));

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Creation failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run
createMissingProvinces();

