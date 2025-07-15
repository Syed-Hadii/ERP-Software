const mongoose = require('mongoose');

const PayrollRequestSchema = new mongoose.Schema({
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    year: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    payrolls: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payroll',
    }],
    processedAt: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
    
}, { timestamps: true });

PayrollRequestSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRequest', PayrollRequestSchema);