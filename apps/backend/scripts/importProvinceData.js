import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProvinceAgriculture from '../src/modules/provinces/province.model.js';

// Mapping giữa SVG ID và Province Code (copy từ frontend)
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Import province agriculture data from JSON file
 */
const importProvinceData = async () => {
  try {
    console.log('🚀 Starting province data import...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Read province soil data
    const dataPath = path.join(__dirname, '../data/province_soil_data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ File not found:', dataPath);
      console.log('💡 Please run extractSoilData.js first to generate province_soil_data.json');
      process.exit(1);
    }

    const provinceSoilData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Found data for ${Object.keys(provinceSoilData).length} provinces\n`);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Import each province
    for (const [code, data] of Object.entries(provinceSoilData)) {
      try {
        // Get SVG ID if available
        const svgId = getSvgIdByProvinceCode(code);

        const provinceData = {
          provinceCode: code,
          simpleMapsId: svgId || undefined,
          provinceName: data.provinceName,
          soilTypes: data.soilTypes || [],
          cropCalendar: [], // Will be added later via Google Sheets or manual entry
          articles: [], // Will be added later
          source: 'Open Development Mekong - CC-BY-SA-4.0',
        };

        // Check if province already exists
        const existing = await ProvinceAgriculture.findOne({ provinceCode: code });

        if (existing) {
          // Update existing - only update soilTypes if not empty
          if (provinceData.soilTypes.length > 0) {
            existing.soilTypes = provinceData.soilTypes;
            existing.simpleMapsId = provinceData.simpleMapsId || existing.simpleMapsId;
            await existing.save();
            updated++;
            console.log(`  ✅ Updated: ${data.provinceName} (${code})`);
          } else {
            skipped++;
            console.log(`  ⏭️  Skipped: ${data.provinceName} (${code}) - No soil data`);
          }
        } else {
          // Create new
          await ProvinceAgriculture.create(provinceData);
          imported++;
          console.log(`  ✅ Imported: ${data.provinceName} (${code})`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${code}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Import completed!`);
    console.log(`   ✅ Imported: ${imported} provinces`);
    console.log(`   🔄 Updated: ${updated} provinces`);
    console.log(`   ⏭️  Skipped: ${skipped} provinces`);
    console.log('='.repeat(50));

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run import
importProvinceData();

