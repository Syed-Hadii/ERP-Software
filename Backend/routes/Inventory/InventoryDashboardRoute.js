const express = require('express');
const inventoryDashboardRouter = express.Router();
const { getInventoryDashboard } = require('../../controllers/Inventory/inventoryDashboardController');
// Apply auth middleware to all inventory routes
// inventoryRouter.use(protect);

// View inventories
inventoryDashboardRouter.get('/', getInventoryDashboard);         // For backward compatibility

module.exports = inventoryDashboardRouter;
