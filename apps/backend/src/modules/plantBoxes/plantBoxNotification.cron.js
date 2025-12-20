import cron from 'node-cron';
import { sendTaskReminders } from './plantBoxNotification.service.js';

/**
 * Plant Box Notification Cron Job
 * Gửi email reminders cho tasks sắp đến
 */

let cronJob = null;

/**
 * Schedule cron job để check và gửi email reminders
 * Chạy mỗi 15 phút để check tasks sắp đến
 */
export const schedulePlantBoxNotificationCron = () => {
  try {
    if (cronJob) {
      console.log('⚠️  Plant box notification cron job already scheduled');
      return;
    }

    // Schedule: Mỗi 15 phút
    // Format: minute hour day-of-month month day-of-week
    // '*/15' = mỗi 15 phút
    cronJob = cron.schedule('*/15 * * * *', async () => {
      console.log('📧 [PlantBox Notification Cron] Running task reminder check...');
      
      try {
        // Gửi reminder 15 phút trước khi task bắt đầu
        const result = await sendTaskReminders(15);
        console.log(`✅ [PlantBox Notification Cron] Completed: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`);
      } catch (error) {
        console.error('❌ [PlantBox Notification Cron] Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    console.log('✅ Plant box notification cron job scheduled (every 15 minutes)');
  } catch (error) {
    console.warn('⚠️  node-cron not installed. Install with: npm install node-cron');
    console.warn('   Plant box notifications will not be sent automatically');
  }
};

/**
 * Stop the cron job
 */
export const stopPlantBoxNotificationCron = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Plant box notification cron job stopped');
  }
};

export default {
  schedulePlantBoxNotificationCron,
  stopPlantBoxNotificationCron,
};

