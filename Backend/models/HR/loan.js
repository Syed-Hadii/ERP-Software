const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
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
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    installmentAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    totalInstallments: {
        type: Number,
        required: true,
        min: 1,
    },
    installmentsPaid: {
        type: Number,
        default: 0,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    paidHistory: [
        {
            amount: Number,
            installmentNumber: Number,
            date: { type: Date, default: Date.now },
            note: String,
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);