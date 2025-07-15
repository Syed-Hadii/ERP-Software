const mongoose = require("mongoose");

const AgroInventorySchema = new mongoose.Schema({
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crop",
        required: true,
    },
    variety: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crop_Variety",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    averageCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCost: {
        type: Number,
        default: 0,
        min: 0
    },
    productionCostBreakdown: {
        seeds: { type: Number, default: 0 },
        fertilizers: { type: Number, default: 0 },
        pesticides: { type: Number, default: 0 },
        irrigation: { type: Number, default: 0 }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

const AgroInventory = mongoose.model("AgroInventory", AgroInventorySchema);
module.exports = AgroInventory;