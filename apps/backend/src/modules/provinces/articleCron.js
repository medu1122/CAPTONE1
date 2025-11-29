/**
 * Article Background Job Scheduler
 * 
 * This module sets up a cron job to automatically fetch articles
 * for all provinces on a schedule.
 * 
 * To enable, import and call scheduleArticleCron() in app.js or server.js
 */

let cronJob = null;

/**
 * Schedule article fetch job
 * Runs daily at 2:00 AM
 */
export const scheduleArticleCron = () => {
  // Only schedule if node-cron is available
  try {
    const cron = require('node-cron');
    
    if (cronJob) {
      console.log('⚠️  Article cron job already scheduled');
      return;
    }

    // Schedule: Every day at 2:00 AM
    // Format: minute hour day month day-of-week
    cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running scheduled article fetch job...');
      
      try {
        // Import here to avoid circular dependencies
        const { fetchAllProvinceArticlesJob } = await import('./articleBackgroundJob.js');
        const result = await fetchAllProvinceArticlesJob();
        console.log(`✅ Scheduled article fetch completed: ${result.totalAdded} new articles`);
      } catch (error) {
        console.error('❌ Error in scheduled article fetch:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    console.log('✅ Article fetch cron job scheduled (daily at 2:00 AM)');
  } catch (error) {
    console.warn('⚠️  node-cron not installed. Install with: npm install node-cron');
    console.warn('   Article auto-fetch will still work on-demand when users access provinces');
  }
};

/**
 * Stop the cron job
 */
export const stopArticleCron = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Article cron job stopped');
  }
};

