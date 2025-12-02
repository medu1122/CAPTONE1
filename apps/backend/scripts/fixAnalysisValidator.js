/**
 * Fix MongoDB collection validator to allow null user for anonymous analyses
 * Run: node scripts/fixAnalysisValidator.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GreenGrow';

async function fixValidator() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('analyses');

    // Update validator to allow null user
    const newValidator = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['source'], // Only source is required now
        properties: {
          user: {
            bsonType: ['objectId', 'null'], // Allow null
            description: 'User ObjectId reference - OPTIONAL (null for anonymous)',
          },
          source: {
            bsonType: 'string',
            enum: ['plantid', 'manual', 'ai'],
            description: 'Analysis source - REQUIRED',
          },
          inputImages: {
            bsonType: 'array',
            description: 'Array of image objects',
            items: {
              bsonType: 'object',
              properties: {
                url: {
                  bsonType: ['string', 'null'],
                },
                base64: {
                  bsonType: ['string', 'null'],
                },
                metadata: {
                  bsonType: ['object', 'null'],
                },
              },
            },
          },
          resultTop: {
            bsonType: ['object', 'null'],
            description: 'Top analysis result',
            properties: {
              plant: {
                bsonType: ['object', 'null'],
                properties: {
                  commonName: {
                    bsonType: ['string', 'null'],
                  },
                  scientificName: {
                    bsonType: ['string', 'null'],
                  },
                },
              },
              confidence: {
                bsonType: ['double', 'int', 'null'],
              },
              summary: {
                bsonType: ['string', 'null'],
              },
            },
          },
          raw: {
            bsonType: ['object', 'null'],
            description: 'Raw API response',
          },
          createdAt: {
            bsonType: 'date',
            description: 'Creation timestamp',
          },
          updatedAt: {
            bsonType: 'date',
            description: 'Update timestamp',
          },
        },
      },
    };

    // Update collection validator
    await db.command({
      collMod: 'analyses',
      validator: newValidator,
      validationLevel: 'moderate', // Only validate new documents
      validationAction: 'warn', // Warn instead of error
    });

    console.log('✅ Collection validator updated successfully');
    console.log('📝 User field now allows null for anonymous users');

    // Test creating an analysis with null user
    console.log('\n🧪 Testing analysis creation with null user...');
    const testDoc = {
      user: null,
      source: 'plantid',
      inputImages: [{ url: 'https://test.com/image.jpg' }],
      resultTop: {
        plant: {
          commonName: 'Cà chua',
          scientificName: 'Solanum lycopersicum',
        },
        confidence: 0.85,
        summary: 'Test analysis',
      },
      raw: {
        plant: { commonName: 'Cà chua' },
        diseases: [],
        isHealthy: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(testDoc);
    console.log('✅ Test document created:', result.insertedId);

    // Clean up
    await collection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document deleted');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code === 121) {
      console.error('Validation error details:', error.errInfo);
    }
    process.exit(1);
  }
}

fixValidator();

