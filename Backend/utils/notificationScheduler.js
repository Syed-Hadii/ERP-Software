const cron = require('node-cron');
const Notification = require('../models/notificationModel');
const { generateAllAgricultureNotifications } = require('../controllers/Agriculture/agricultureNotificationController');
const { generateAllCattleNotifications } = require('../controllers/Cattle/cattleNotificationController');
const { generateAllInventoryNotifications } = require('../controllers/Inventory/inventoryNotificationController');
const { generateAllHRNotifications } = require('../controllers/HR/hrNotificationController');
const { generateAllFinanceNotifications } = require('../controllers/Finance/financeNotificationController');

// Helper function to create response handler
const createResponseHandler = (source) => ({
  json: (data) => {
    if (data.success) {
      console.log(`✅ Generated ${data.count || 0} ${source} notifications`);
    } else {
      console.error(`❌ Error generating ${source} notifications:`, data.message);
    }
  },
  status: (code) => ({
    json: (data) => {
      console.error(`❌ Error (${code}) generating ${source} notifications:`, data.message);
    }
  })
});

const setupNotificationScheduler = (app) => {
  console.log('🔄 Setting up notification scheduler...');

  // Clean up old read notifications daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Clearing old read notifications...');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Notification.deleteMany({
        isRead: true,
        readAt: { $lt: thirtyDaysAgo }
      });
      console.log(`✅ Cleared ${result.deletedCount} old read notifications`);
    } catch (error) {
      console.error('❌ Error clearing old notifications:', error);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // Agriculture notifications - every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running agriculture notifications...');
    try {
      if (typeof generateAllAgricultureNotifications !== 'function') {
        throw new Error('Agriculture notification controller not found');
      }
      await generateAllAgricultureNotifications({}, createResponseHandler('Agriculture'));
    } catch (error) {
      console.error('❌ Error in agriculture notification scheduler:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // Cattle notifications - every hour at 15 minutes past
  cron.schedule('15 * * * *', async () => {
    console.log('🔄 Running cattle notifications...');
    try {
      await generateAllCattleNotifications({}, createResponseHandler('Cattle'));
    } catch (error) {
      console.error('❌ Error in cattle notification scheduler:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // Inventory notifications - every hour at 30 minutes past
  cron.schedule('30 * * * *', async () => {
    console.log('🔄 Running inventory notifications...');
    try {
      if (typeof generateAllInventoryNotifications !== 'function') {
        throw new Error('Inventory notification controller not found');
      }
      await generateAllInventoryNotifications({}, createResponseHandler('Inventory'));
    } catch (error) {
      console.error('❌ Error in inventory notification scheduler:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // HR notifications - every hour at 45 minutes past
  cron.schedule('45 * * * *', async () => {
    console.log('🔄 Running HR notifications...');
    try {
      await generateAllHRNotifications({}, createResponseHandler('HR'));
    } catch (error) {
      console.error('❌ Error in HR notification scheduler:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // Finance notifications - every hour at 50 minutes past
  cron.schedule('50 * * * *', async () => {
    console.log('🔄 Running finance notifications...');
    try {
      await generateAllFinanceNotifications({}, createResponseHandler('Finance'));
    } catch (error) {
      console.error('❌ Error in finance notification scheduler:', error.message);
    }
  }, {
    timezone: 'Asia/Karachi'
  });

  // Manual trigger endpoint
  app.post('/api/generate-all-notifications', async (req, res) => {
    console.log('🔄 Manually triggering all notification generators...');
    try {
      const results = [];
      try {
        await generateAllAgricultureNotifications(req, createResponseHandler('Agriculture (manual)'));
        results.push('Agriculture');
      } catch (e) {
        console.error('❌ Agriculture notifications skipped:', e.message);
      }
      await generateAllCattleNotifications(req, createResponseHandler('Cattle (manual)'));
      results.push('Cattle');
      try {
        await generateAllInventoryNotifications(req, createResponseHandler('Inventory (manual)'));
        results.push('Inventory');
      } catch (e) {
        console.error('❌ Inventory notifications skipped:', e.message);
      }
      await generateAllHRNotifications(req, createResponseHandler('HR (manual)'));
      results.push('HR');
      await generateAllFinanceNotifications(req, createResponseHandler('Finance (manual)'));
      results.push('Finance');
      res.status(200).json({ success: true, message: `Notifications generated for: ${results.join(', ')}` });
    } catch (error) {
      console.error('❌ Error generating notifications:', error.message);
      res.status(500).json({ success: false, message: 'Error generating notifications', error: error.message });
    }
  });

  console.log('✅ Notification scheduler set up successfully.');
};

module.exports = { setupNotificationScheduler };