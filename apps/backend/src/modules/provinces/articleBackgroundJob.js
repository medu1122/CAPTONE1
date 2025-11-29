import mongoose from 'mongoose';
import ProvinceAgriculture from './province.model.js';
import { fetchProvinceArticles } from './articleFetcher.service.js';

/**
 * Background job to fetch articles for all provinces
 * This should be run periodically (e.g., daily via cron)
 */
export const fetchAllProvinceArticlesJob = async () => {
  try {
    console.log('🚀 Starting background article fetch job...\n');

    const provinces = await ProvinceAgriculture.find({});
    console.log(`📊 Found ${provinces.length} provinces\n`);

    let totalFetched = 0;
    let totalAdded = 0;

    for (const province of provinces) {
      try {
        console.log(`📍 Processing: ${province.provinceName} (${province.provinceCode})`);
        
        const articles = await fetchProvinceArticles(province.provinceName);
        totalFetched += articles.length;
        
        if (articles.length > 0) {
          console.log(`  ✅ Fetched ${articles.length} articles`);
          
          // Check existing articles
          const existingUrls = new Set(province.articles.map(a => a.url));
          const newArticles = articles.filter(a => a.url && !existingUrls.has(a.url));
          
          if (newArticles.length > 0) {
            province.articles.push(...newArticles);
            // Sort by date (newest first)
            province.articles.sort((a, b) => {
              const dateA = a.date ? new Date(a.date) : new Date(0);
              const dateB = b.date ? new Date(b.date) : new Date(0);
              return dateB - dateA;
            });
            // Keep only latest 20 articles per province
            province.articles = province.articles.slice(0, 20);
            await province.save();
            totalAdded += newArticles.length;
            console.log(`  ✅ Added ${newArticles.length} new articles`);
          } else {
            console.log(`  ⏭️  No new articles`);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${province.provinceName}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Background job completed!`);
    console.log(`   📰 Total fetched: ${totalFetched} articles`);
    console.log(`   ✅ Total added: ${totalAdded} new articles`);
    console.log('='.repeat(50));

    return { totalFetched, totalAdded };
  } catch (error) {
    console.error('\n❌ Background job failed:', error);
    throw error;
  }
};

/**
 * Run background job (standalone script)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  import('dotenv').then(dotenv => {
    dotenv.config();
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    
    mongoose.connect(mongoUri)
      .then(() => {
        console.log('✅ Connected to MongoDB\n');
        return fetchAllProvinceArticlesJob();
      })
      .then(() => {
        mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        mongoose.connection.close();
        process.exit(1);
      });
  });
}

