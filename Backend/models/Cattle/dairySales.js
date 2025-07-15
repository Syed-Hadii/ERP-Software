const mongoose = require("mongoose");

const ItemRowSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DairyProduct",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, "Unit price cannot be negative"],
  },
  actualCost: {  // COGS per unit (what it cost YOU)
    type: Number,
    min: 0,
    default: 0, // Will be set at sale approval
  },
});

const DairySalesSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  reference: {
    type: String,
    trim: true,
    index: true,
    unique: true,
    sparse: true, // Allows null/undefined but enforces uniqueness when present
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  items: [ItemRowSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: [0, "Total price cannot be negative"],
  },
  invoiceNumber: {
    type: String,
    trim: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  inventoryProcessed: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const DairySales = mongoose.model("DairySales", DairySalesSchema);
module.exports = DairySales;