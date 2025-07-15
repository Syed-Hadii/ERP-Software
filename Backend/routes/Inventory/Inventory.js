const express = require('express');
const inventoryRouter = express.Router();
const { viewManagerInventory, viewAgricultureInventory, viewCattleInventory, updateInventory, destroyInventory } = require('../../controllers/Inventory/inventory');
const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all inventory routes
// inventoryRouter.use(protect);

// View inventories
inventoryRouter.get('/manager', viewManagerInventory);
inventoryRouter.get('/agriculture', viewAgricultureInventory);
inventoryRouter.get('/cattle', viewCattleInventory);

// Update inventory record
inventoryRouter.put('/update', updateInventory);

// Delete inventory record - multiple options for compatibility
inventoryRouter.delete('/delete/:id', destroyInventory);  // RESTful endpoint
inventoryRouter.post('/delete', destroyInventory);        // For backward compatibility

module.exports = inventoryRouter;
