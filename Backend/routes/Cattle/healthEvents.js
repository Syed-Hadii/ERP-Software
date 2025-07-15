const express = require('express');
const healthEventsController = require('../../controllers/Cattle/healthEventsController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
const healthRouter = express.Router();

// Apply auth middleware to all health event routes
// healthRouter.use(protect);
// GET all health events
healthRouter.get('/', healthEventsController.listHealthEvents);

// GET a specific health event by ID
healthRouter.get('/:id', healthEventsController.getHealthEvent);

// GET upcoming health events for the next 7 days
healthRouter.get('/upcoming/week', healthEventsController.getUpcomingEvents);

// POST create a new health event
healthRouter.post('/', healthEventsController.createHealthEvent);

// PUT update a health event
healthRouter.put('/:id', healthEventsController.updateHealthEvent);

// DELETE a health event
healthRouter.delete('/:id', healthEventsController.deleteHealthEvent);

module.exports = healthRouter;