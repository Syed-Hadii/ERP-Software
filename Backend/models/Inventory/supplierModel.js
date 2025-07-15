const mongoose = require("mongoose");

const TransactionHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['Purchase', 'Payment Made', 'Credit Note Received', 'Debit Note'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  description: String,
  balance: {
    type: Number,
    required: true
  }
}, { _id: true });

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
    trim: true,
  },
  contact: {
    type: String,
    match: [/^\+?[\d\s-]{8,15}$/, "Invalid phone number format"],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"],
  },
  address: {
    type: String,
    trim: true,
  },
  openingBalance: {
    type: Number,
    required: [true, "Opening balance is required"],
    min: [0, "Opening balance cannot be negative"],
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  coaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChartAccount",
    required: true,
  },
  transactionHistory: [TransactionHistorySchema],
  creditLimit: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", SupplierSchema);
module.exports = Supplier;