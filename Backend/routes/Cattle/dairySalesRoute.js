const express = require('express');
const { save, view } = require('../../controllers/Cattle/dairySalesController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
const dairySaleRouter = express.Router();

// Apply auth middleware to all dairy sale routes
// dairySaleRouter.use(protect);
// Route to create a new dairy sale
dairySaleRouter.post('/', save);

// Route to list dairy sales with optional date filtering and pagination
dairySaleRouter.get('/', view);

module.exports = dairySaleRouter;