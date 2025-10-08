#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * Usage: node test-db-connection.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/GreenGrow';

console.log('🔍 Testing MongoDB Connection...');
console.log(`📡 Connection String: ${MONGO_URI}`);
console.log('⏳ Connecting...\n');

const testConnection = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connection Successful!');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`📈 Collections: ${Object.keys(conn.connection.collections).length} found`);

    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📋 Available Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`🚨 Error: ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure MongoDB is running on your system');
    console.error('2. Check if the connection string is correct');
    console.error('3. Verify MongoDB is accessible on port 27017');
    console.error(`4. Current connection string: ${MONGO_URI}`);
    process.exit(1);
  }
};

// Run the test
testConnection();
