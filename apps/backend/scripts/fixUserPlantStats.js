/**
 * Script to recalculate user plant statistics
 * Fixes the totalPlants count based on actual PlantBox documents
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/modules/auth/auth.model.js';
import PlantBox from '../src/modules/plantBoxes/plantBox.model.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GreenGrow';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixUserPlantStats() {
  console.log('\n🔧 Starting user plant stats recalculation...\n');

  try {
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Count active plant boxes for this user
        const plantBoxCount = await PlantBox.countDocuments({
          user: user._id,
          isActive: true
        });

        const currentCount = user.stats?.totalPlants || 0;

        // Only update if count is different
        if (currentCount !== plantBoxCount) {
          await User.findByIdAndUpdate(
            user._id,
            { $set: { 'stats.totalPlants': plantBoxCount } },
            { new: true }
          );

          console.log(`✅ ${user.name} (${user.email}): ${currentCount} → ${plantBoxCount} plants`);
          updatedCount++;
        } else {
          console.log(`ℹ️  ${user.name} (${user.email}): ${plantBoxCount} plants (no change)`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${users.length - updatedCount - errorCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('\n✅ Plant stats recalculation completed!\n');

  } catch (error) {
    console.error('❌ Error during recalculation:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await fixUserPlantStats();
    
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();

