const express = require('express');

const financeDashboardRouter = express.Router();
const {
    getDashboardData,
    getAccountBreakdown,
    getTransactionDetails
} = require('../../controllers/Finance/financeDashboard');

// Route to get dashboard data
financeDashboardRouter.get('/dashboard', getDashboardData);

// Route to get account breakdown by group
financeDashboardRouter.get('/account-breakdown/:group', getAccountBreakdown);

// Route to get transaction details by ID
financeDashboardRouter.get('/transaction/:id', getTransactionDetails);

module.exports = financeDashboardRouter;