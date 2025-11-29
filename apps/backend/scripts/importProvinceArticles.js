import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProvinceAgriculture from '../src/modules/provinces/province.model.js';

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
 * 4. Thêm GOOGLE_SHEET_ID và credentials vào .env
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
 * Import Articles from ARTICLES sheet
 * 
 * Expected columns:
 * - Province Code: Mã tỉnh (e.g., "DN", "HN")
 * - Title: Tiêu đề bài báo
 * - URL: Link bài báo
 * - Source: Nguồn (optional)
 * - Date: Ngày đăng (optional, format: YYYY-MM-DD)
 */
const importArticlesFromSheet = async (doc) => {
  try {
    console.log('📰 Importing articles from ARTICLES sheet...');
    
    // Find sheet by title
    const sheet = doc.sheetsByTitle['ARTICLES'];
    if (!sheet) {
      throw new Error('Sheet "ARTICLES" not found. Please create a sheet named "ARTICLES"');
    }

    await sheet.loadHeaderRow();
    console.log('📋 Headers:', sheet.headerValues);

    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows`);

    if (rows.length === 0) {
      console.log('⚠️  No articles to import');
      return 0;
    }

    // Group articles by province code
    const articlesByProvince = {};

    rows.forEach((row, idx) => {
      try {
        const provinceCode = row.get('Province Code') || row.get('Mã tỉnh');
        const title = row.get('Title') || row.get('Tiêu đề');
        const url = row.get('URL') || row.get('Link');
        const source = row.get('Source') || row.get('Nguồn') || 'Nguồn không xác định';
        const dateStr = row.get('Date') || row.get('Ngày đăng');
        const imageUrl = row.get('Image URL') || row.get('Hình ảnh') || null;

        if (!provinceCode || !title || !url) {
          console.warn(`⚠️  Row ${idx + 2}: Missing required fields (Province Code, Title, or URL)`);
          return;
        }

        const provinceCodeUpper = provinceCode.toUpperCase().trim();
        
        if (!articlesByProvince[provinceCodeUpper]) {
          articlesByProvince[provinceCodeUpper] = [];
        }

        const article = {
          title: title.trim(),
          url: url.trim(),
          source: source.trim(),
          date: dateStr ? new Date(dateStr) : new Date(),
          imageUrl: imageUrl ? imageUrl.trim() : null,
        };

        articlesByProvince[provinceCodeUpper].push(article);
      } catch (error) {
        console.error(`❌ Error processing row ${idx + 2}:`, error.message);
      }
    });

    console.log(`\n📊 Found articles for ${Object.keys(articlesByProvince).length} provinces`);

    // Update provinces with articles
    let updated = 0;
    let notFound = 0;

    for (const [provinceCode, articles] of Object.entries(articlesByProvince)) {
      try {
        const province = await ProvinceAgriculture.findOne({ provinceCode });
        
        if (!province) {
          console.log(`  ⚠️  Province not found: ${provinceCode}`);
          notFound++;
          continue;
        }

        // Add articles (avoid duplicates by URL)
        const existingUrls = new Set(province.articles.map(a => a.url));
        const newArticles = articles.filter(a => !existingUrls.has(a.url));

        if (newArticles.length > 0) {
          province.articles.push(...newArticles);
          // Sort by date (newest first)
          province.articles.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
          });
          await province.save();
          console.log(`  ✅ Added ${newArticles.length} article(s) to ${province.provinceName} (${provinceCode})`);
          updated++;
        } else {
          console.log(`  ⏭️  No new articles for ${province.provinceName} (${provinceCode})`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${provinceCode}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Import completed!`);
    console.log(`   ✅ Updated: ${updated} provinces`);
    console.log(`   ⚠️  Not found: ${notFound} provinces`);
    console.log('='.repeat(50));

    return updated;
  } catch (error) {
    console.error('❌ Error importing articles:', error);
    throw error;
  }
};

/**
 * Main import function
 */
const main = async () => {
  try {
    console.log('🚀 Starting province articles import from Google Sheets...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Initialize Google Sheets
    const doc = await initGoogleSheets();
    console.log('');

    // Import articles
    await importArticlesFromSheet(doc);

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

