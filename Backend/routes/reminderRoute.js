const { Router } = require("express");
const reminderRouter = Router();
const { getReminders, addReminder, deleteReminder, markReminderCompleted } = require("../controllers/reminderController.js");
const { protect } = require('../middlewares/authMiddleware');

// Apply auth middleware to all reminder routes
reminderRouter.use(protect);

// Routes
reminderRouter.get('/get', getReminders);
reminderRouter.post('/add', addReminder);
reminderRouter.delete('/delete', deleteReminder); // Receiving `id` via `req.body`
reminderRouter.patch('/update', markReminderCompleted);

module.exports = reminderRouter;
