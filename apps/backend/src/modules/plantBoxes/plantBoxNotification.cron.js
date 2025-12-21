import cron from 'node-cron';
import { sendTaskReminders, sendWeatherAlerts, sendUncompletedTaskWarnings } from './plantBoxNotification.service.js';
import { autoRefreshExpiredStrategies } from './plantBox.service.js';

/**
 * Plant Box Notification Cron Job
 * Gửi email reminders cho tasks sắp đến
 */

let taskReminderJob = null;
let weatherAlertJob = null;
let autoRefreshJob = null;
let uncompletedTaskWarningJob = null;

/**
 * Schedule cron job để check và gửi email reminders
 * Chạy mỗi 15 phút để check tasks sắp đến
 */
export const schedulePlantBoxNotificationCron = () => {
  try {
    if (taskReminderJob) {
      console.log('⚠️  Plant box notification cron job already scheduled');
      return;
    }

    // Schedule 1: Task reminders - mỗi 15 phút
    taskReminderJob = cron.schedule('*/15 * * * *', async () => {
      console.log('📧 [PlantBox Notification Cron] Running task reminder check...');
      
      try {
        const result = await sendTaskReminders(15);
        console.log(`✅ [PlantBox Notification Cron] Completed: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`);
      } catch (error) {
        console.error('❌ [PlantBox Notification Cron] Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    // Schedule 2: Weather alerts - hàng ngày lúc 6:00 AM
    weatherAlertJob = cron.schedule('0 6 * * *', async () => {
      console.log('🌤️ [Weather Alert Cron] Running weather check...');
      
      try {
        const result = await sendWeatherAlerts();
        console.log(`✅ [Weather Alert Cron] Completed: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`);
      } catch (error) {
        console.error('❌ [Weather Alert Cron] Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    // Schedule 3: Auto-refresh expired strategies - hàng ngày lúc 3:00 AM
    autoRefreshJob = cron.schedule('0 3 * * *', async () => {
      console.log('🔄 [Auto Refresh Cron] Running care strategy refresh check...');
      
      try {
        const result = await autoRefreshExpiredStrategies();
        console.log(`✅ [Auto Refresh Cron] Completed: ${result.refreshed} refreshed, ${result.errors} errors`);
      } catch (error) {
        console.error('❌ [Auto Refresh Cron] Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    // Schedule 4: Uncompleted task warnings - hàng ngày lúc 3:00 PM
    uncompletedTaskWarningJob = cron.schedule('0 15 * * *', async () => {
      console.log('⚠️ [Uncompleted Tasks Cron] Running missed task check...');
      
      try {
        const result = await sendUncompletedTaskWarnings();
        console.log(`✅ [Uncompleted Tasks Cron] Completed: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`);
      } catch (error) {
        console.error('❌ [Uncompleted Tasks Cron] Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });
    
    console.log('✅ Plant box notification cron job scheduled (every 15 minutes)');
    console.log('✅ Weather alert cron job scheduled (daily at 6:00 AM)');
    console.log('✅ Auto-refresh cron job scheduled (daily at 3:00 AM)');
    console.log('✅ Uncompleted task warning cron job scheduled (daily at 3:00 PM)');
  } catch (error) {
    console.warn('⚠️  node-cron not installed. Install with: npm install node-cron');
    console.warn('   Plant box notifications will not be sent automatically');
  }
};

/**
 * Stop the cron jobs
 */
export const stopPlantBoxNotificationCron = () => {
  if (taskReminderJob) {
    taskReminderJob.stop();
    taskReminderJob = null;
    console.log('🛑 Plant box notification cron job stopped');
  }
  if (weatherAlertJob) {
    weatherAlertJob.stop();
    weatherAlertJob = null;
    console.log('🛑 Weather alert cron job stopped');
  }
  if (autoRefreshJob) {
    autoRefreshJob.stop();
    autoRefreshJob = null;
    console.log('🛑 Auto-refresh cron job stopped');
  }
  if (uncompletedTaskWarningJob) {
    uncompletedTaskWarningJob.stop();
    uncompletedTaskWarningJob = null;
    console.log('🛑 Uncompleted task warning cron job stopped');
  }
};

export default {
  schedulePlantBoxNotificationCron,
  stopPlantBoxNotificationCron,
};

