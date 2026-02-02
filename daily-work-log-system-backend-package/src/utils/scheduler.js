const cron = require('node-cron');
const notificationController = require('../controllers/notification.controller');

// Schedule tasks to run at specific times

// Check for missing logs every day at 9:00 AM
const scheduleMissingLogCheck = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled task: Check for missing logs');
    await notificationController.createMissingLogNotifications();
  });
};

// Check for incomplete logs every day at 10:00 AM
const scheduleIncompleteLogCheck = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('Running scheduled task: Check for incomplete logs');
    await notificationController.createIncompleteLogNotifications();
  });
};

// Initialize all scheduled tasks
const initScheduledTasks = () => {
  scheduleMissingLogCheck();
  scheduleIncompleteLogCheck();
  console.log('Scheduled tasks initialized');
};

module.exports = {
  initScheduledTasks
};
