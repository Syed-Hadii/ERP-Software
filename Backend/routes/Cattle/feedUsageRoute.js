const express = require('express');
const { logFeedUsage, listFeedUsage } = require('../../controllers/Cattle/feedUsageController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
const feedUsageRouter = express.Router();

// Apply auth middleware to all feed usage routes
// feedUsageRouter.use(protect);
// Route to log new feed usage
feedUsageRouter.post('/log', logFeedUsage);

// Route to list feed usage with optional filters
feedUsageRouter.get('/list', listFeedUsage);

module.exports = feedUsageRouter;