const Reminder = require("../models/reminderModel.js");

// Fetch all reminders
const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find();
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
}

// Add a new reminder
 const addReminder = async (req, res) => {
    const { name, date } = req.body; // Receiving `id` from `req.body`
    console.log(req.body);
    try {
        const newReminder = new Reminder({ name, date });
        await newReminder.save();
        res.status(201).json(newReminder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add reminder' });
    }
}

// Delete a reminder
  const deleteReminder = async (req, res) => {
    const { id } = req.body; // Receive the `id` via `req.body`
    console.log(req.body);
    try {
        await Reminder.findByIdAndDelete(id);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
}

// Mark reminder as completed
const markReminderCompleted = async (req, res) => {
    const { id } = req.body; // Receive the `id` via `req.body`
    try {
        const updatedReminder = await Reminder.findByIdAndUpdate(
            id,
            { isCompleted: true },
            { new: true }
        );
        res.json(updatedReminder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update reminder' });
    }
}

module.exports = { getReminders, addReminder, deleteReminder, markReminderCompleted  };
