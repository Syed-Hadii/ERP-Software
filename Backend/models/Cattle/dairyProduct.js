const mongoose = require("mongoose");

const DairyProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    unit: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Raw Milk', 'Processed Milk', 'Dairy Product', 'Feed'],
        required: true
    },
    description: String,
    standardCost: { type: Number, default: 0, min: 0 }, // Optional fallback
    cattleInventoryAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount' },
    incomeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount' }
}, {
    timestamps: true
});

const DairyProduct = mongoose.model("DairyProduct", DairyProductSchema);
module.exports = DairyProduct;