const { Router } = require('express');
const inventoryNotificationRouter = Router();
const {
    generateLowStockNotifications,
    generateRequestNotifications,
    generateInventoryRequestResponseNotifications,
    generateAllInventoryNotifications
} = require('../../controllers/Inventory/inventoryNotificationController');
const { protect, notificationAccess } = require('../../middlewares/authMiddleware');

// Apply auth middleware
inventoryNotificationRouter.use(protect, notificationAccess);

// Inventory notification generation routes
inventoryNotificationRouter.post('/generate/low-stock', generateLowStockNotifications);
inventoryNotificationRouter.post('/generate/requests', generateRequestNotifications);
inventoryNotificationRouter.post('/generate/request-responses', generateInventoryRequestResponseNotifications);
inventoryNotificationRouter.post('/generate/all', generateAllInventoryNotifications);

module.exports = inventoryNotificationRouter; 