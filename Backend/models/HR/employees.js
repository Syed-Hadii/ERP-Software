const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    phone: {
        type: String
    },
    department: {
        type: String,
        enum: ['Agriculture', 'Cattle'],
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    initialSalary: {
        type: Number,
        required: true, min: 0
    },
    basicSalary: {
        type: Number, min: 0
    },
    joinDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
    }
}, { timestamps: true });

// Initialize basicSalary from initialSalary on creation
EmployeeSchema.pre('save', function (next) {
    if (this.isNew) {
        this.basicSalary = this.initialSalary;
    }
    next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);