const express = require('express');
const feedProcessRouter = express.Router();
const { processFeed } = require('../../controllers/Cattle/feed-process');
// const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all feed process routes
// feedProcessRouter.use(protect);
// POST /api/feed/process 
feedProcessRouter.post('/', processFeed);

module.exports = feedProcessRouter;
