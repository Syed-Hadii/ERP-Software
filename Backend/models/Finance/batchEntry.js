const mongoose = require('mongoose');

// Batch Entry Schema for each row in batch
const batchEntrySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    party: { type: String, enum: ['Customer', 'Supplier', 'Other'], required: true },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: function () { return this.party === 'Customer'; }
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: function () { return this.party === 'Supplier'; }
    },
    chartAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartAccount',
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    narration: { type: String, trim: true }
}, { _id: false });

// Main Batch Transaction Schema
const batchTransactionSchema = new mongoose.Schema({
    voucherNumber: { type: String, required: true, unique: true },
    reference: { type: String, trim: true },
    voucherType: { type: String, enum: ['Payment', 'Receipt'], required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Bank'], required: true },
    bankAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: function () { return this.paymentMethod === 'Bank'; }
    },
    transactionNumber: { type: String, trim: true },
    clearanceDate: { type: Date },
    cashAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartAccount',
        required: function () { return this.paymentMethod === 'Cash'; }
    },
    description: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Draft', 'Posted', 'Void'], default: 'Draft' },
    entries: { type: [batchEntrySchema], validate: v => v && v.length >= 1 },
    createdBy: { type: String, default: 'system' },
    fiscalYear: { type: String }
}, { timestamps: true });

// Auto-generate voucher number
batchTransactionSchema.pre('validate', async function (next) {
    if (this.isNew && !this.voucherNumber) {
        if (!this.voucherType) {
            return next(new Error('voucherType is required to generate voucher number.'));
        }

        const getFiscalYear = () => {
            const date = new Date();
            const fiscalStartMonth = 6; // July (0-indexed)
            return date.getMonth() >= fiscalStartMonth
                ? `FY${String(date.getFullYear() + 1).slice(-2)}`
                : `FY${String(date.getFullYear()).slice(-2)}`;
        };

        const prefix = this.voucherType.substring(0, 3).toUpperCase();
        const fy = getFiscalYear();
        const counterName = `voucher_${prefix}_${fy}`;

        try {
            const counter = await mongoose.model('Counter').findByIdAndUpdate(
                counterName,
                { $inc: { seq: 1 } },
                { new: true, upsert: true, session: this.$session() }
            );

            this.voucherNumber = `${prefix}-${fy}-${String(counter.seq).padStart(5, '0')}`;
            this.fiscalYear = fy;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Static methods
batchTransactionSchema.statics = {
    async findByFiscalYear(fy) {
        return this.find({ fiscalYear: fy });
    },

    async getFiscalYearSummary() {
        return this.aggregate([
            {
                $group: {
                    _id: "$fiscalYear",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                    firstVoucher: { $first: "$voucherNumber" },
                    lastVoucher: { $last: "$voucherNumber" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    }
};

const BatchTransaction = mongoose.model('BatchTransaction', batchTransactionSchema);

module.exports = BatchTransaction;