const mongoose = require('mongoose');

const accountEntrySchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount', required: true },
  debitAmount: { type: Number, default: 0, min: 0 },
  creditAmount: { type: Number, default: 0, min: 0 },
  narration: { type: String, trim: true },
}, { _id: false });

const journalEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reference: { type: String, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['Draft', 'Posted'], default: 'Draft' },
  accounts: { type: [accountEntrySchema], validate: v => v.length >= 2 },
  createdBy: { type: String, default: 'system' }
}, { timestamps: true });

journalEntrySchema.index({ reference: 1 });
journalEntrySchema.index({ status: 1 });

const JournalVoucher = mongoose.model('JournalVoucher', journalEntrySchema);
module.exports = JournalVoucher;