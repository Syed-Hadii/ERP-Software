const { Router } = require('express');
const agricultureNotificationRouter = Router();
const {
    generateHarvestNotifications,
    generateScheduleNotifications,
    generateAllAgricultureNotifications
} = require('../../controllers/Agriculture/agricultureNotificationController');
const { protect, notificationAccess } = require('../../middlewares/authMiddleware');

// Apply auth middleware
agricultureNotificationRouter.use(protect, notificationAccess);

// Agriculture notification generation routes
agricultureNotificationRouter.post('/generate/harvest', generateHarvestNotifications);
agricultureNotificationRouter.post('/generate/schedule', generateScheduleNotifications);
agricultureNotificationRouter.post('/generate/all', generateAllAgricultureNotifications);

module.exports = agricultureNotificationRouter; 