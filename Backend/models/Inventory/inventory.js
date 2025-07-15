const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Item',
    required: true
  },
  owner: {
    type: String,
    enum: ['manager', 'agriculture', 'cattle'],
    required: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, "Quantity cannot be negative"],
  },
  averageCost: {
    type: Number,
    default: 0,
    min: [0, "Average cost cannot be negative"],
  },
  totalCost: {
    type: Number,
    default: 0,
    min: [0, "Total cost cannot be negative"],
  },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);