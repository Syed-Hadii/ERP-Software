const { Router } = require('express');
const cattleNotificationRouter = Router();
const {
    generateHealthNotifications,
    generateMilkProductionNotifications,
    generateAllCattleNotifications
} = require('../../controllers/Cattle/cattleNotificationController');
const { protect, notificationAccess } = require('../../middlewares/authMiddleware');

// Apply auth middleware
cattleNotificationRouter.use(protect, notificationAccess);

// Cattle notification generation routes
cattleNotificationRouter.post('/generate/health', generateHealthNotifications);
cattleNotificationRouter.post('/generate/milk-production', generateMilkProductionNotifications);
cattleNotificationRouter.post('/generate/all', generateAllCattleNotifications);

module.exports = cattleNotificationRouter; 