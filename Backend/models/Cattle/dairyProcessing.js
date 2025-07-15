const mongoose = require("mongoose");

const OutputProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DairyProduct',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    }
});

const DairyProcessingSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    batchNumber: {
        type: String,
        unique: true
    },
    rawMilkProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DairyProduct',
        required: true
    },
    inputMilkQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    outputProducts: {
        type: [OutputProductSchema],
        validate: {
            validator: v => v.length > 0,
            message: 'At least one output product is required'
        }
    },
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    inventoryProcessed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save hook to auto-generate batch number
DairyProcessingSchema.pre('save', async function (next) {
    if (!this.batchNumber) {
        const count = await this.constructor.countDocuments();
        this.batchNumber = `PROC-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

const DairyProcessing = mongoose.model("DairyProcessing", DairyProcessingSchema);
module.exports = DairyProcessing;