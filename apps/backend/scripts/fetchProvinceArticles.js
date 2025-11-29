// This script now uses the shared service
// Use: node scripts/fetchProvinceArticles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAllProvinceArticlesJob } from '../src/modules/provinces/articleBackgroundJob.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect and run
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

