const express = require('express');
const exitEventsController = require('../../controllers/Cattle/exitEventsController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
const exitEventsRouter = express.Router();

// Apply auth middleware to all exit events routes
// exitEventsRouter.use(protect);
// Get available active cattle based on type and breed
exitEventsRouter.get('/available-cattle', exitEventsController.getAvailableCattle);

// Get all exit events
exitEventsRouter.get('/', exitEventsController.listExitEvents);

// Get a single exit event by ID
exitEventsRouter.get('/:id', exitEventsController.getExitEvent);

// Create a new exit event
exitEventsRouter.post('/', exitEventsController.createExitEvent);

// Update an exit event
exitEventsRouter.put('/:id', exitEventsController.updateExitEvent);

// Delete multiple exit events
exitEventsRouter.delete('/delete-multiple', exitEventsController.deleteMultipleExitEvent);

// Delete single exit event
exitEventsRouter.delete('/:id', exitEventsController.deleteExitEvent);

module.exports = exitEventsRouter;