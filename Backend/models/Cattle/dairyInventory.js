const mongoose = require("mongoose");

const DairyInventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DairyProduct',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reorderLevel: {
        type: Number,
        required: true,
        min: 0
    },
    averageCost: {
        type: Number, default: 0, min: 0, set: function (value) {
            return parseFloat(value.toFixed(4)); // Ensure precision
      } }, // New field
    totalCost: { type: Number, default: 0, min: 0 }, // New field
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    batchNumber: {
        type: String
    },
    expiryDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying of low stock items
DairyInventorySchema.index({ quantity: 1, reorderLevel: 1 });

const DairyInventory = mongoose.model("DairyInventory", DairyInventorySchema);
module.exports = DairyInventory;