const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountTitle: { type: String, required: true },
  accountNumber: { type: String, required: true, unique: true },
  openingBalance: { type: Number, required: true },
  currentBalance: { type: Number, default: 0 },
  chartAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount', required: true },
  createdBy: { type: String, default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', bankAccountSchema);