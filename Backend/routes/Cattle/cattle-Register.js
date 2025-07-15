const express = require('express');
const cattleController = require('../../controllers/Cattle/cattleRegisterController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all cattle registration routes
const cattleRegRouter = express.Router();

// cattleRegRouter.use(protect);
// Route 1: Create new cattle registration
cattleRegRouter.post('/register', cattleController.createCattle);

// Route 2: Get all registered cattle
cattleRegRouter.get('/all', cattleController.listCattle);
cattleRegRouter.get('/active', cattleController.listActiveCattle);

// Route 3: Get cattle by ID
cattleRegRouter.get('/:id', cattleController.getCattle);

// Route 4: Update cattle information
cattleRegRouter.put('/:id', cattleController.updateCattle);

// Route 5: Delete multiple cattles
cattleRegRouter.delete('/delete-multiple', cattleController.deleteMultipleCattles);

// Route 6: Delete single cattle registration
cattleRegRouter.delete('/:id', cattleController.deleteCattle);

module.exports = cattleRegRouter;