const express = require('express');
const cropDashboardRouter = express.Router();
const {
    getActiveCrops,
    getLandUtilization,
    getUpcomingTasks,
    getRecentAssignments,
    getCropStatusDistribution,
    getUpcomingHarvests,
    getLandMetrics,
    getFarmerMetrics
} = require('../../controllers/Agriculture/cropDashboard');
// const { protect, admin } = require('../../middlewares/authMiddleware');

// cropDashboardRouter.use(protect)
// Dashboard routes
cropDashboardRouter.get('/active-crops', getActiveCrops);
cropDashboardRouter.get('/land-utilization', getLandUtilization);
cropDashboardRouter.get('/upcoming-tasks', getUpcomingTasks);
cropDashboardRouter.get('/recent-assignments', getRecentAssignments);
cropDashboardRouter.get('/crop-status-distribution', getCropStatusDistribution);
cropDashboardRouter.get('/upcoming-harvests', getUpcomingHarvests);
cropDashboardRouter.get('/land-metrics', getLandMetrics);
cropDashboardRouter.get('/farmer-metrics', getFarmerMetrics);

module.exports = cropDashboardRouter;