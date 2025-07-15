const mongoose = require("mongoose");

const ItemRowSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
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
  discountPercent: {
    type: Number,
    min: [0, "Discount percentage cannot be negative"],
    max: [100, "Discount percentage cannot exceed 100"],
    default: 0,
  },
});

const PurchaseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: [/^PI-\d{4}-\d{2}-\d{2}-\d{3}$/, "Invoice number must follow format PI-YYYY-MM-DD-SEQ"],
  },
  date: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  reference: {
    type: String,
    trim: true,
    index: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
    index: true,
  },
  supplierAddress: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  items: {
    type: [ItemRowSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: "At least one item is required",
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, "Subtotal cannot be negative"],
  },

  discountAmount: {
    type: Number,
    required: true,
    min: [0, "Discount amount cannot be negative"],
  },

  totalAmount: {
    type: Number,
    required: true,
    min: [0, "Total amount cannot be negative"],
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
    required: true,
    default: "system",
  },
}, { timestamps: true });

const PurchaseInvoice = mongoose.models.PurchaseInvoice || mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);
module.exports = PurchaseInvoice;