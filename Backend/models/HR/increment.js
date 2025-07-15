const mongoose = require('mongoose');

const IncrementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Employee', 'User'],
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: function () { return this.type === 'Employee'; },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return this.type === 'User'; },
    },
    date: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    remarks: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Increment', IncrementSchema);