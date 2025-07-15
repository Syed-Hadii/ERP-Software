const mongoose = require("mongoose");

const coaLedgerSchema = new mongoose.Schema({
  coaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChartAccount",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  debit: {
    type: Number,
    default: 0
  },
  credit: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    required: true // e.g. INV-0012, JOURNAL-99
  },
  sourceType: {
    type: String,
    enum: ['Sale Invoice', 'Purchase Invoice', 'Payment Voucher', 'Journal Entry', 'Opening Balance', 'Credit Note', 'Debit Note'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, { timestamps: true });

coaLedgerSchema.index({ coaId: 1, date: 1 });

module.exports = mongoose.model("COALedger", coaLedgerSchema);
