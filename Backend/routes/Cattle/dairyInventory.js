const express = require('express');
const dairyInventoryRouter = express.Router();
const inventoryController = require('../../controllers/Cattle/dairyInventory');
// const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all dairy inventory routes  
// dairyInventoryRouter.use(protect);

// Dairy Inventory Routes
dairyInventoryRouter.get('/', inventoryController.getAllInventory);
dairyInventoryRouter.get('/low-stock', inventoryController.getLowStockItems);
dairyInventoryRouter.get('/:id', inventoryController.getInventoryById);
dairyInventoryRouter.put('/:id', inventoryController.updateInventory);
dairyInventoryRouter.delete('/:id', inventoryController.deleteInventory);

module.exports = dairyInventoryRouter;
