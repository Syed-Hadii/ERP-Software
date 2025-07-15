const mongoose = require('mongoose');

const chartAccountSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  group: {
    type: String,
    enum: ['Assets', 'Liabilities', 'Equity', 'Income', 'Expense'],
    required: true,
  },
  category: {
    type: String,
    enum: [
      'Current Asset', 'Fixed Asset', 'Other Asset',
      'Current Liability', 'Long Term Liability',
      'Owner\'s Equity', 'Owner\'s Capital', 'Retained Earnings', 'Owner\'s Drawings',
      'Sales Revenue', 'Interest Income', 'Other Income', 'Operating Revenue', 'Non-Operating Revenue',
      'Direct Expense', 'Other Expense', 'Operating Expense',
    ],
    required: function () { return !this.parentAccount; },
  },
  nature: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: [true, 'Account nature is required'],
    default: function () {
      return ['Assets', 'Expense'].includes(this.group) ? 'Debit' : 'Credit';
    }
  },
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartAccount',
    default: null
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  isTaxAccount: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, { timestamps: true });

// Method to get all child accounts
chartAccountSchema.methods.getChildAccounts = async function () {
  return await this.model('ChartAccount').find({ parentAccount: this._id }).lean();
};

// Method to calculate and update parent balance
chartAccountSchema.methods.calculateAndUpdateParentBalance = async function (session) {
  if (this.parentAccount) {
    const parent = await this.model('ChartAccount').findById(this.parentAccount).session(session);
    if (parent) {
      const childAccounts = await this.model('ChartAccount').find({ parentAccount: parent._id }).session(session);
      parent.currentBalance = childAccounts.reduce((sum, child) => sum + (child.currentBalance || 0), 0);
      parent.openingBalance = 0; // Parent accounts should not have their own opening balance
      await parent.save({ session });
      await parent.calculateAndUpdateParentBalance(session); // Recursively update grandparent
    }
  }
};

module.exports = mongoose.model('ChartAccount', chartAccountSchema);