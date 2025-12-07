import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

// Collections that are actively used
const USED_COLLECTIONS = [
  'users',
  'auth_tokens',
  'email_verifications',
  'password_resets',
  'chat_sessions',
  'chats',
  'analyses',
  'plants',
  'product_recommendations',
  'weather_cache',
  'plant_boxes',
  'products',
  'biological_methods',
  'cultural_practices',
  'province_agriculture',
  'posts',
  'alerts',
  'complaints',
  'reports',
  'notifications',
  'comments', // New collection
];

async function cleanupUnusedCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📊 Checking collections...\n');

    const unusedCollections = [];
    const emptyCollections = [];

    for (const collection of collections) {
      const name = collection.name;
      const count = await db.collection(name).countDocuments();

      if (!USED_COLLECTIONS.includes(name)) {
        if (count === 0) {
          emptyCollections.push(name);
          console.log(`⚠️  Unused empty collection: ${name} (0 documents)`);
        } else {
          console.log(`⚠️  Unused collection with data: ${name} (${count} documents) - NOT DELETED`);
        }
      } else {
        console.log(`✅ Used collection: ${name} (${count} documents)`);
      }
    }

    if (emptyCollections.length > 0) {
      console.log(`\n🗑️  Found ${emptyCollections.length} unused empty collections:`);
      emptyCollections.forEach(c => console.log(`   - ${c}`));

      // Delete empty unused collections
      for (const name of emptyCollections) {
        try {
          await db.collection(name).drop();
          console.log(`   ✅ Deleted: ${name}`);
        } catch (error) {
          console.log(`   ❌ Error deleting ${name}:`, error.message);
        }
      }
    } else {
      console.log('\n✅ No unused empty collections found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

cleanupUnusedCollections();

