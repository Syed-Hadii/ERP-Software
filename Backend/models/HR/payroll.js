const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
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
    year: {
        type: Number,
        required: true,
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    daysInMonth: {
        type: Number,
        required: function () { return this.type === 'Employee'; },
        min: 1,
    },
    totalWorkingDays: {
        type: Number,
        required: function () { return this.type === 'Employee'; },
        min: 0,
    },
    presentDays: {
        type: Number,
        required: function () { return this.type === 'Employee'; },
        min: 0,
    },
    leaveDays: {
        type: Number,
        required: function () { return this.type === 'Employee'; },
        min: 0,
    },
    absentDays: {
        type: Number,
        required: function () { return this.type === 'Employee'; },
        min: 0,
    },
    basicSalary: {
        type: Number,
        required: true,
        min: 0,
    },
    absenceDeduction: {
        type: Number,
        default: 0,
        min: 0,
    },
    loanDeduction: {
        type: Number,
        default: 0,
        min: 0,
    },
    bonuses: {
        type: Number,
        default: 0,
        min: 0,
    },
    netPay: {
        type: Number,
        required: true,
        min: 0,
    },
    financeRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollRequest',
    },
    financeStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
}, { timestamps: true });

PayrollSchema.index(
    { employee: 1, year: 1, month: 1 },
    {
        unique: true,
        partialFilterExpression: { employee: { $exists: true } }
    }
);

// only index user   Yr/Mon when user‑type
PayrollSchema.index(
    { user: 1, year: 1, month: 1 },
    {
        unique: true,
        partialFilterExpression: { user: { $exists: true } }
    }
);


module.exports = mongoose.model('Payroll', PayrollSchema);