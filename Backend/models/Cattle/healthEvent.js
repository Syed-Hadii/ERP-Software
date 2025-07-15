const mongoose = require("mongoose");

const HealthEventSchema = new mongoose.Schema({
    cattleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CattleRegister',
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    eventType: {
        type: String,
        enum: ['Vaccination', 'Treatment', 'Check-up'],
        required: true
    },
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: function () {
            return ['Vaccination', 'Treatment'].includes(this.eventType);
        },
        default: undefined,
    },
    dosage: {
        type: String,
        required: function () {
            return ['Vaccination', 'Treatment'].includes(this.eventType);
        }
    },
    
    vetTechnician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    nextDueDate: {
        type: Date,
        required: function () {
            return this.eventType === 'Vaccination';
        }
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending'],
        default: 'Pending'  
    },
    notes: String
}, {
    timestamps: true
});

// Index for efficient querying of upcoming events
HealthEventSchema.index({ nextDueDate: 1 });

const HealthEvent = mongoose.model("HealthEvent", HealthEventSchema);
module.exports = HealthEvent;