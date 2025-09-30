const cron = require('node-cron');
const alertService = require('./alert.service');

// Schedule cron job to run every 3 hours
// Format: second minute hour day-of-month month day-of-week
const scheduleAlertCron = () => {
  cron.schedule('0 */3 * * *', async () => {
    console.log('Running weather alert cron job...');
    
    try {
      const sentCount = await alertService.processAllAlerts();
      console.log(`Sent ${sentCount} weather alerts`);
    } catch (error) {
      console.error(`Error in weather alert cron job: ${error.message}`);
    }
  });
  
  console.log('Weather alert cron job scheduled');
};

module.exports = {
  scheduleAlertCron,
};
