const express = require('express');
const InventoryWriteOffRouter = express.Router();
const { writeOffInventoryHandler } = require('../../controllers/Inventory/inventoryWriteOffController');

// POST route to handle inventory write-off
InventoryWriteOffRouter.post('/', writeOffInventoryHandler);

module.exports = InventoryWriteOffRouter;