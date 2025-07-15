const mongoose = require("mongoose")

const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    inventoryAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount' },
    revenueAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount' },
});
const Crop = mongoose.model("Crop", cropSchema);

const cropVarietySchema = new mongoose.Schema({
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crop",
        required: true
    },
    variety: {
        type: String,
        required: true,
    },


}, {
    timestamps: true,
});
const Crop_Variety = mongoose.model("Crop_Variety", cropVarietySchema);
module.exports = { Crop_Variety, Crop };