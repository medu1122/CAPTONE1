import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/modules/treatments/product.model.js';
import BiologicalMethod from '../src/modules/treatments/biologicalMethod.model.js';
import CulturalPractice from '../src/modules/treatments/culturalPractice.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Parse CSV line (handles quoted fields with commas)
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

/**
 * Parse CSV file
 */
const parseCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    data.push(obj);
  }

  return data;
};

/**
 * Import Products from THUOC sheet
 */
const importProducts = async (csvPath) => {
  try {
    console.log('📦 Importing products from:', csvPath);
    
    const data = parseCSV(csvPath);
    console.log(`Found ${data.length} products in CSV`);

    const products = data.map((row) => ({
      name: row['Tên sản phẩm'] || row['name'],
      activeIngredient: row['Hoạt chất'] || row['activeIngredient'],
      manufacturer: row['Nhà SX'] || row['manufacturer'],
      targetDiseases: (row['Dùng cho bệnh'] || row['targetDiseases'] || '').split(',').map(s => s.trim()).filter(Boolean),
      targetCrops: (row['Dùng cho cây'] || row['targetCrops'] || '').split(',').map(s => s.trim()).filter(Boolean),
      dosage: row['Liều lượng'] || row['dosage'],
      usage: row['Cách dùng'] || row['usage'],
      price: row['Giá'] || row['price'],
      imageUrl: row['Image URL'] || row['imageUrl'] || '/images/products/placeholder.png',
      source: row['Nguồn'] || row['source'],
      verified: true,
      frequency: row['Tần suất'] || row['frequency'],
      isolationPeriod: row['Cách ly'] || row['isolationPeriod'],
      precautions: (row['Lưu ý'] || row['precautions'] || '').split(',').map(s => s.trim()).filter(Boolean),
    }));

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✅ Imported ${result.length} products`);
    
    return result.length;
  } catch (error) {
    console.error('❌ Error importing products:', error);
    throw error;
  }
};

/**
 * Import Biological Methods from SINHHOC sheet
 */
const importBiologicalMethods = async (csvPath) => {
  try {
    console.log('🌿 Importing biological methods from:', csvPath);
    
    const data = parseCSV(csvPath);
    console.log(`Found ${data.length} biological methods in CSV`);

    const methods = data.map((row) => ({
      name: row['Tên phương pháp'] || row['name'],
      targetDiseases: (row['Dùng cho bệnh'] || row['targetDiseases'] || '').split(',').map(s => s.trim()).filter(Boolean),
      materials: row['Vật liệu cần thiết'] || row['materials'],
      steps: row['Cách thực hiện'] || row['steps'],
      timeframe: row['Thời gian'] || row['timeframe'],
      effectiveness: row['Hiệu quả (%)'] || row['effectiveness'],
      source: row['Nguồn'] || row['source'],
      verified: (row['Verified'] || row['verified']) === '✓' || true,
    }));

    // Clear existing methods
    await BiologicalMethod.deleteMany({});
    console.log('🗑️  Cleared existing biological methods');

    // Insert new methods
    const result = await BiologicalMethod.insertMany(methods);
    console.log(`✅ Imported ${result.length} biological methods`);
    
    return result.length;
  } catch (error) {
    console.error('❌ Error importing biological methods:', error);
    throw error;
  }
};

/**
 * Import Cultural Practices from CANHTAC sheet
 */
const importCulturalPractices = async (csvPath) => {
  try {
    console.log('🌾 Importing cultural practices from:', csvPath);
    
    const data = parseCSV(csvPath);
    console.log(`Found ${data.length} cultural practices in CSV`);

    const practices = data.map((row) => {
      // Map Vietnamese category to English enum
      const categoryMap = {
        'Đất': 'soil',
        'Nước': 'water',
        'Phân bón': 'fertilizer',
        'Ánh sáng': 'light',
        'Khoảng cách': 'spacing',
      };

      const category = categoryMap[row['Danh mục']] || row['category'] || 'soil';

      return {
        category,
        action: row['Hành động'] || row['action'],
        description: row['Mô tả chi tiết'] || row['description'],
        priority: row['Ưu tiên'] || row['priority'] || 'Medium',
        applicableTo: (row['Áp dụng cho'] || row['applicableTo'] || '').split(',').map(s => s.trim()).filter(Boolean),
        source: row['Nguồn'] || row['source'],
        verified: (row['Verified'] || row['verified']) === '✓' || true,
      };
    });

    // Clear existing practices
    await CulturalPractice.deleteMany({});
    console.log('🗑️  Cleared existing cultural practices');

    // Insert new practices
    const result = await CulturalPractice.insertMany(practices);
    console.log(`✅ Imported ${result.length} cultural practices`);
    
    return result.length;
  } catch (error) {
    console.error('❌ Error importing cultural practices:', error);
    throw error;
  }
};

/**
 * Main import function
 */
const main = async () => {
  try {
    console.log('🚀 Starting treatment data import...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI or MONGO_URI in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define CSV paths (adjust these paths based on where you save the CSV files)
    const dataDir = path.join(__dirname, '../data');
    const productsPath = path.join(dataDir, 'products.csv');
    const biologicalPath = path.join(dataDir, 'biological_methods.csv');
    const culturalPath = path.join(dataDir, 'cultural_practices.csv');

    // Check if files exist
    const files = [
      { path: productsPath, name: 'products.csv' },
      { path: biologicalPath, name: 'biological_methods.csv' },
      { path: culturalPath, name: 'cultural_practices.csv' },
    ];

    console.log('🔍 Checking for CSV files...');
    for (const file of files) {
      if (!fs.existsSync(file.path)) {
        console.log(`⚠️  Warning: ${file.name} not found at ${file.path}`);
      } else {
        console.log(`✅ Found: ${file.name}`);
      }
    }
    console.log('');

    let totalImported = 0;

    // Import products
    if (fs.existsSync(productsPath)) {
      const count = await importProducts(productsPath);
      totalImported += count;
      console.log('');
    }

    // Import biological methods
    if (fs.existsSync(biologicalPath)) {
      const count = await importBiologicalMethods(biologicalPath);
      totalImported += count;
      console.log('');
    }

    // Import cultural practices
    if (fs.existsSync(culturalPath)) {
      const count = await importCulturalPractices(culturalPath);
      totalImported += count;
      console.log('');
    }

    console.log('='.repeat(50));
    console.log(`🎉 Import completed! Total: ${totalImported} documents imported`);
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
main();

