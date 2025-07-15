const express = require('express');

const cattleDashboardRouter = express.Router();
const {
    getCattleDairyDashboard
} = require('../../controllers/Cattle/cattleDashboardController');

// Dashboard routes
cattleDashboardRouter.get('/', getCattleDairyDashboard);

module.exports = cattleDashboardRouter;