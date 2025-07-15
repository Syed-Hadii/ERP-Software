const mongoose = require("mongoose");

const MilkProductionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    cattleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CattleRegister',
        required: true
    },
    shift: {
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening'],
        required: true
    },
    volume: {
        type: Number,
        required: true,
        min: 0
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    notes: String
}, {
    timestamps: true
});

// Compound index to prevent duplicate entries for the same cattle and shift
MilkProductionSchema.index({ date: 1, cattleId: 1, shift: 1 }, { unique: true });

const MilkProduction = mongoose.model("MilkProduction", MilkProductionSchema);
module.exports = MilkProduction;