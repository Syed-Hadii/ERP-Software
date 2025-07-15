const mongoose = require('mongoose');

const accountEntrySchema = new mongoose.Schema({
  chartAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartAccount', required: true },
  amount: { type: Number, required: true, min: 0 },
  narration: { type: String, trim: true },
}, { _id: false });

const transactionVoucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  reference: { type: String, trim: true },
  voucherType: { type: String, enum: ['Payment', 'Receipt'], required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Bank'], required: true },
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount',
    required: function () { return this.paymentMethod === 'Bank'; },
  },
  transactionNumber: { type: String, trim: true },
  clearanceDate: { type: Date },
  cashAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
    required: function () { return this.paymentMethod === 'Cash'; },
  },
  party: { type: String, enum: ['Customer', 'Supplier', 'Other'], required: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: function () { return this.party === 'Customer'; },
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: function () { return this.party === 'Supplier'; },
  },
  description: { type: String, trim: true },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Draft', 'Posted', 'Void'], default: 'Draft' },
  accounts: { type: [accountEntrySchema], validate: v => v.length >= 1 },
  createdBy: { type: String, default: 'system' }
}, { timestamps: true });

// Auto-generate voucher number
transactionVoucherSchema.pre('validate', async function (next) {
  if (this.isNew && !this.voucherNumber) {
    const count = await this.constructor.countDocuments({});
    this.voucherNumber = `${this.voucherType.substring(0, 3).toUpperCase()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('TransactionVoucher', transactionVoucherSchema);