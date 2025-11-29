import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../src/modules/treatments/product.model.js';
import BiologicalMethod from '../src/modules/treatments/biologicalMethod.model.js';
import CulturalPractice from '../src/modules/treatments/culturalPractice.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Google Sheets Configuration
 * 
 * Bạn cần:
 * 1. Tạo Service Account trên Google Cloud Console
 * 2. Download JSON credentials
 * 3. Share Google Sheet với email của Service Account
 * 4. Thêm GOOGLE_SHEET_ID và path đến credentials vào .env
 */

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * Initialize Google Sheets API
 */
const initGoogleSheets = async () => {
  try {
    console.log('🔐 Authenticating with Google Sheets API...');
    
    if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing Google Sheets credentials in .env');
    }

    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    console.log('✅ Connected to Google Sheet:', doc.title);
    return doc;
  } catch (error) {
    console.error('❌ Failed to connect to Google Sheets:', error.message);
    throw error;
  }
};

/**
 * Import Products from THUOC sheet
 */
const importProductsFromSheet = async (doc) => {
  try {
    console.log('📦 Importing products from THUOC sheet...');
    
    // Find sheet by title
    const sheet = doc.sheetsByTitle['THUOC'];
    if (!sheet) {
      throw new Error('Sheet "THUOC" not found');
    }

    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows`);

    const products = rows.map((row) => ({
      name: row.get('Tên sản phẩm'),
      activeIngredient: row.get('Hoạt chất'),
      manufacturer: row.get('Nhà SX'),
      targetDiseases: (row.get('Dùng cho bệnh') || '').split(',').map(s => s.trim()).filter(Boolean),
      targetCrops: (row.get('Dùng cho cây') || '').split(',').map(s => s.trim()).filter(Boolean),
      dosage: row.get('Liều lượng'),
      usage: row.get('Cách dùng'),
      price: row.get('Giá'),
      imageUrl: row.get('Image URL') || '/images/products/placeholder.png',
      source: row.get('Nguồn') || 'Google Sheets - THUOC', // Default source if not provided
      verified: true,
      frequency: row.get('Tần suất'),
      isolationPeriod: row.get('Cách ly'),
      precautions: (row.get('Lưu ý') || '').split(',').map(s => s.trim()).filter(Boolean),
    })).filter(p => p.name && p.source); // Filter out empty rows and rows without source

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert new products
    if (products.length > 0) {
      const result = await Product.insertMany(products);
      console.log(`✅ Imported ${result.length} products`);
      return result.length;
    } else {
      console.log('⚠️  No products to import');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error importing products:', error);
    throw error;
  }
};

/**
 * Import Biological Methods from SINHHOC sheet
 */
const importBiologicalFromSheet = async (doc) => {
  try {
    console.log('🌿 Importing biological methods from SINHHOC sheet...');
    
    const sheet = doc.sheetsByTitle['SINHHOC'];
    if (!sheet) {
      throw new Error('Sheet "SINHHOC" not found');
    }

    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows`);

    const methods = rows.map((row) => ({
      name: row.get('Tên phương pháp'),
      targetDiseases: (row.get('Dùng cho bệnh') || '').split(',').map(s => s.trim()).filter(Boolean),
      materials: row.get('Vật liệu cần thiết'),
      steps: row.get('Cách thực hiện'),
      timeframe: row.get('Thời gian'),
      effectiveness: row.get('Hiệu quả (%)'),
      source: row.get('Nguồn') || 'Google Sheets - SINHHOC', // Default source if not provided
      verified: row.get('Verified') === '✓' || true,
    })).filter(m => m.name && m.source);

    // Clear existing methods
    await BiologicalMethod.deleteMany({});
    console.log('🗑️  Cleared existing biological methods');

    // Insert new methods
    if (methods.length > 0) {
      const result = await BiologicalMethod.insertMany(methods);
      console.log(`✅ Imported ${result.length} biological methods`);
      return result.length;
    } else {
      console.log('⚠️  No biological methods to import');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error importing biological methods:', error);
    throw error;
  }
};

/**
 * Import Cultural Practices from CANHTAC sheet
 */
const importCulturalFromSheet = async (doc) => {
  try {
    console.log('🌾 Importing cultural practices from CANHTAC sheet...');
    
    const sheet = doc.sheetsByTitle['CANHTAC'];
    if (!sheet) {
      throw new Error('Sheet "CANHTAC" not found');
    }

    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows`);

    // Map Vietnamese category to English enum
    const categoryMap = {
      'Đất': 'soil',
      'Nước': 'water',
      'Phân bón': 'fertilizer',
      'Ánh sáng': 'light',
      'Khoảng cách': 'spacing',
    };

    const practices = rows.map((row) => {
      const categoryVN = row.get('Danh mục');
      const category = categoryMap[categoryVN] || 'soil';

      return {
        category,
        action: row.get('Hành động'),
        description: row.get('Mô tả chi tiết'),
        priority: row.get('Ưu tiên') || 'Medium',
        applicableTo: (row.get('Áp dụng cho') || '').split(',').map(s => s.trim()).filter(Boolean),
        source: row.get('Nguồn') || 'Google Sheets - CANHTAC', // Default source if not provided
        verified: row.get('Verified') === '✓' || true,
      };
    }).filter(p => p.action && p.source);

    // Clear existing practices
    await CulturalPractice.deleteMany({});
    console.log('🗑️  Cleared existing cultural practices');

    // Insert new practices
    if (practices.length > 0) {
      const result = await CulturalPractice.insertMany(practices);
      console.log(`✅ Imported ${result.length} cultural practices`);
      return result.length;
    } else {
      console.log('⚠️  No cultural practices to import');
      return 0;
    }
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
    console.log('🚀 Starting Google Sheets import...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI or MONGO_URI in .env');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Initialize Google Sheets
    const doc = await initGoogleSheets();
    console.log('');

    let totalImported = 0;

    // Import all sheets
    try {
      const productsCount = await importProductsFromSheet(doc);
      totalImported += productsCount;
      console.log('');
    } catch (error) {
      console.error('⚠️  Skipping THUOC sheet:', error.message);
    }

    try {
      const bioCount = await importBiologicalFromSheet(doc);
      totalImported += bioCount;
      console.log('');
    } catch (error) {
      console.error('⚠️  Skipping SINHHOC sheet:', error.message);
    }

    try {
      const culturalCount = await importCulturalFromSheet(doc);
      totalImported += culturalCount;
      console.log('');
    } catch (error) {
      console.error('⚠️  Skipping CANHTAC sheet:', error.message);
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

