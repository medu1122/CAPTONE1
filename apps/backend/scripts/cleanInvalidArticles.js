/**
 * Script to clean up articles without valid titles from database
 * Run: node scripts/cleanInvalidArticles.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProvinceAgriculture from '../src/modules/provinces/province.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanInvalidArticles = async () => {
  try {
    // Try both MONGO_URI and MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/GreenGrow';
    
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      console.warn('⚠️  No MONGO_URI or MONGODB_URI found in .env, using default: mongodb://127.0.0.1:27017/GreenGrow');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const provinces = await ProvinceAgriculture.find({});
    console.log(`📊 Found ${provinces.length} provinces`);

    let totalRemoved = 0;
    let totalKept = 0;

    for (const province of provinces) {
      const beforeCount = province.articles.length;
      
      // Filter out articles without valid title or url
      province.articles = province.articles.filter(article => {
        const title = article.title?.trim() || '';
        const url = article.url?.trim() || '';
        
        // Check for invalid titles
        const invalidTitles = ['không có tiêu đề', 'no title', 'untitled', ''];
        const hasValidTitle = title && 
                              typeof title === 'string' && 
                              title.length > 5 &&
                              !invalidTitles.includes(title.toLowerCase());
        
        // Check for invalid URLs
        const invalidUrls = ['#', '', 'http://', 'https://'];
        const hasValidUrl = url && 
                           typeof url === 'string' && 
                           url.length > 10 && // URLs should be longer
                           !invalidUrls.includes(url.toLowerCase()) &&
                           (url.startsWith('http://') || url.startsWith('https://'));
        
        if (!hasValidTitle || !hasValidUrl) {
          totalRemoved++;
          console.log(`   ❌ Removing invalid article: title="${title.substring(0, 30)}", url="${url.substring(0, 30)}"`);
          return false;
        }
        totalKept++;
        return true;
      });

      const afterCount = province.articles.length;
      const removed = beforeCount - afterCount;

      if (removed > 0) {
        await province.save();
        console.log(`🧹 ${province.provinceName}: Removed ${removed} invalid articles (${beforeCount} → ${afterCount})`);
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Total articles kept: ${totalKept}`);
    console.log(`   Total articles removed: ${totalRemoved}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanInvalidArticles();

