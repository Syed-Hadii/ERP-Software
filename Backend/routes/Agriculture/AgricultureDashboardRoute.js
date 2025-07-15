const express = require('express');
const agricultureDashboardRouter = express.Router();
const { getAgricultureDashboard } = require('../../controllers/Agriculture/AgricultureDashboardController');
// Apply auth middleware to all inventory routes
// inventoryRouter.use(protect);

// View inventories
agricultureDashboardRouter.get('/', getAgricultureDashboard);         // For backward compatibility

module.exports = agricultureDashboardRouter;
