const express = require('express');
const dairyProductController = require('../../controllers/Cattle/dairyProduct');
// const { protect, admin } = require('../../middlewares/authMiddleware');
const dairyProductRouter = express.Router();

// Apply auth middleware to all dairy product routes
// dairyProductRouter.use(protect);
// Create a new dairy product
dairyProductRouter.post('/', dairyProductController.createDairyProduct);

// Get all dairy products
dairyProductRouter.get('/', dairyProductController.getAllDairyProducts);

// Get a single dairy product by ID
dairyProductRouter.get('/:id', dairyProductController.getDairyProductById);

// Update a dairy product
dairyProductRouter.put('/:id', dairyProductController.updateDairyProduct);

// Soft delete a dairy product
dairyProductRouter.delete('/:id', dairyProductController.deleteDairyProduct);

// Get dairy products by category
dairyProductRouter.get('/category/:category', dairyProductController.getDairyProductsByCategory);

module.exports = dairyProductRouter;