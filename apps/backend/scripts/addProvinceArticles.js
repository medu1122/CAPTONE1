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
 * Add articles to provinces
 * 
 * Format:
 * {
 *   "PROVINCE_CODE": [
 *     {
 *       "title": "Tiêu đề bài báo",
 *       "url": "https://example.com/article",
 *       "source": "Nguồn báo",
 *       "date": "2024-01-15" // Optional
 *     }
 *   ]
 * }
 */
const articlesData = {
  // Ví dụ: Đà Nẵng
  "DN": [
    {
      title: "Nông nghiệp Đà Nẵng phát triển bền vững",
      url: "https://example.com/danang-agriculture",
      source: "Báo Nông nghiệp",
      date: new Date("2024-01-15"),
      imageUrl: "https://example.com/image.jpg" // Optional
    },
    {
      title: "Thời tiết Đà Nẵng thuận lợi cho sản xuất nông nghiệp",
      url: "https://example.com/danang-weather",
      source: "Trung tâm Khí tượng Thủy văn",
      date: new Date("2024-02-01")
    }
  ],
  // Ví dụ: Hà Nội
  "HN": [
    {
      title: "Hà Nội đẩy mạnh nông nghiệp công nghệ cao",
      url: "https://example.com/hanoi-tech-agriculture",
      source: "Báo Hà Nội Mới",
      date: new Date("2024-01-20"),
      imageUrl: "https://example.com/image2.jpg" // Optional
    }
  ],
  // Thêm các tỉnh khác tại đây...
};

/**
 * Add articles to provinces in database
 */
const addProvinceArticles = async () => {
  try {
    console.log('🚀 Starting to add province articles...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    let updated = 0;
    let notFound = 0;

    // Process each province
    for (const [provinceCode, articles] of Object.entries(articlesData)) {
      try {
        const province = await ProvinceAgriculture.findOne({ provinceCode });
        
        if (!province) {
          console.log(`  ⚠️  Province not found: ${provinceCode}`);
          notFound++;
          continue;
        }

        // Add articles (avoid duplicates)
        const existingUrls = new Set(province.articles.map(a => a.url));
        const newArticles = articles.filter(a => !existingUrls.has(a.url));

        if (newArticles.length > 0) {
          province.articles.push(...newArticles);
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
    console.log(`🎉 Update completed!`);
    console.log(`   ✅ Updated: ${updated} provinces`);
    console.log(`   ⚠️  Not found: ${notFound} provinces`);
    console.log('='.repeat(50));
    console.log('\n💡 Tip: Edit this script to add more articles for other provinces.');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to add articles:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run script
addProvinceArticles();

