const mongoose = require("mongoose");

const CropAssignSchema = new mongoose.Schema({
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
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true,
  },
  land: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Land",
    required: true,
  },
  seed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, "Quantity must be greater than 0"],
  },
  seedSowingDate: {
    type: Date,
    required: true,
  },
  expectedHarvestDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v > this.seedSowingDate;
      },
      message: "Expected harvest date must be after sowing date",
    },
  },
  cropStatus: {
    type: String,
    enum: ['Sown', 'Growing', 'Harvested'],
    default: "Sown",
  },
  yieldEstimate: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  incurredCosts: { type: Number, default: 0 }, // Total cost incurred for this crop
  actualYieldQuantity: { type: Number, min: 0 },
  actualYieldUnit: { type: String },

}, {
  timestamps: true,
});

const CropAssign = mongoose.model("Crop_Sow", CropAssignSchema);

module.exports = CropAssign;