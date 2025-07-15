const express = require('express');
const RequestRouter = express.Router();
const { createRequest, viewRequests, handleRequest } = require('../../controllers/Inventory/InventoryRequest');
const { protect } = require('../../middlewares/authMiddleware');

// Apply auth middleware to all inventory request routes
RequestRouter.use(protect);

// Inventory request routes
RequestRouter.post('/inventory-requests', createRequest);           // Create a new inventory request
RequestRouter.post('/inventory-requests/:id/handle', handleRequest); // Approve or reject a request
RequestRouter.get('/inventory-requests', viewRequests);             // View all requests 

module.exports = RequestRouter;