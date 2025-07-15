const { Schema, model } = require("mongoose");

const reminderSchema = new Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
});
const Reminder = model("Reminder", reminderSchema)
module.exports = Reminder;
