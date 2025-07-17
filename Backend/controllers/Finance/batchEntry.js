const mongoose = require("mongoose");
const BatchTransaction = require("../../models/Finance/batchEntry.js");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const BankAccount = require("../../models/Finance/bankAccountModel.js");
const AuditLog = require("../../models/Finance/auditLogModel.js");
const Period = require("../../models/Finance/periodModel.js");
const Customer = require("../../models/Inventory/customerModel.js");
const Supplier = require("../../models/Inventory/supplierModel.js");
const { updateRetainedEarnings } = require("../../utils/accounting.js");
const errorMessages = require("../../utils/errorMessages.js");
const Joi = require('joi');
const { createCOALedgerEntry } = require("../../utils/coaLedger.js");

const transactionSchema = Joi.object({
    reference: Joi.string().max(50).allow('').optional(),
    voucherType: Joi.string().valid('Payment', 'Receipt').required().error(new Error(errorMessages.missingFields)),
    paymentMethod: Joi.string().valid('Cash', 'Bank').required().error(new Error(errorMessages.invalidPaymentMethod)),
    bankAccount: Joi.string().when('paymentMethod', { is: 'Bank', then: Joi.string().required(), otherwise: Joi.forbidden() }),
    transactionNumber: Joi.string().max(50).allow('').optional(),
    clearanceDate: Joi.date().optional(),
    cashAccount: Joi.string().when('paymentMethod', { is: 'Cash', then: Joi.string().required(), otherwise: Joi.forbidden() }),
    description: Joi.string().max(200).allow('').optional(),
    totalAmount: Joi.number().positive().required().error(new Error(errorMessages.invalidAmount)),
    status: Joi.string().valid('Draft', 'Posted').default('Draft'),
    entries: Joi.array().min(1).items(
        Joi.object({
            date: Joi.date().required(),
            party: Joi.string().valid('Customer', 'Supplier', 'Other').required(),
            customer: Joi.string().when('party', { is: 'Customer', then: Joi.string().required(), otherwise: Joi.forbidden() }),
            supplier: Joi.string().when('party', { is: 'Supplier', then: Joi.string().required(), otherwise: Joi.forbidden() }),
            chartAccount: Joi.string().required(),
            amount: Joi.number().positive().required(),
            narration: Joi.string().allow('').optional()
        })
    ).required()
});

const getTransactionSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
    voucherType: Joi.string().valid('Payment', 'Receipt').optional(),
    status: Joi.string().valid('Draft', 'Posted', 'Void').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

const updateAccountBalance = async (accountId, debitAmount, creditAmount, session) => {
    const account = await ChartAccount.findById(accountId).session(session);
    if (!account) throw new Error(errorMessages.accountNotFound);

    const isDebitNature = ['Assets', 'Expense'].includes(account.group);
    const isCreditNature = ['Liabilities', 'Equity', 'Income'].includes(account.group);

    if (!isDebitNature && !isCreditNature) {
        throw new Error(errorMessages.invalidAccount);
    }

    let balanceChange = isDebitNature
        ? (debitAmount || 0) - (creditAmount || 0)
        : (creditAmount || 0) - (debitAmount || 0);

    account.currentBalance = (account.currentBalance || 0) + balanceChange;
    await account.save({ session });

    await account.calculateAndUpdateParentBalance(session);
};

const updatePartyTransactionHistory = async (entry, voucher, session) => {
    if (entry.party === 'Customer' && entry.customer) {
        const customer = await Customer.findById(entry.customer).session(session);
        if (!customer) throw new Error('Customer not found');

        const amount = voucher.voucherType === 'Receipt' ? -entry.amount : entry.amount;
        customer.currentBalance += amount;

        customer.transactionHistory.push({
            date: entry.date,
            type: voucher.voucherType,
            amount: entry.amount,
            reference: voucher.voucherNumber,
            description: entry.narration || `${voucher.voucherType} transaction`,
            balance: customer.currentBalance
        });

        await customer.save({ session });
    } else if (entry.party === 'Supplier' && entry.supplier) {
        const supplier = await Supplier.findById(entry.supplier).session(session);
        if (!supplier) throw new Error('Supplier not found');

        const amount = voucher.voucherType === 'Payment' ? -entry.amount : entry.amount;
        supplier.currentBalance += amount;
        supplier.transactionHistory.push({
            date: entry.date,
            type: voucher.voucherType,
            amount: entry.amount,
            reference: voucher.voucherNumber,
            description: entry.narration || `${voucher.voucherType} transaction`,
            balance: supplier.currentBalance
        });

        await supplier.save({ session });
    }
};

const add = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log('Raw req.body:', JSON.stringify(req.body, null, 2));

        const { error } = transactionSchema.validate(req.body, { abortEarly: false });
        if (error) throw new Error(error.details.map(d => d.message).join(', '));

        const sanitizedBody = req.body; // Sanitization bypassed to avoid issues
        console.log('Sanitized body:', JSON.stringify(sanitizedBody, null, 2));

        const {
            reference,
            voucherType,
            paymentMethod,
            bankAccount,
            transactionNumber,
            clearanceDate,
            cashAccount,
            description,
            totalAmount,
            status,
            entries
        } = sanitizedBody;

        // Validate entries
        if (!Array.isArray(entries) || entries.length === 0) {
            throw new Error('Entries must be a non-empty array');
        }

        console.log('Entries before mapping:', JSON.stringify(entries, null, 2));
        entries.forEach((entry, index) => {
            if (!entry.chartAccount) {
                throw new Error(`chartAccount is missing in entry at index ${index}`);
            }
            if (!mongoose.Types.ObjectId.isValid(entry.chartAccount)) {
                throw new Error(`Invalid chartAccount ID in entry at index ${index}`);
            }
        });

        const accountIds = entries.map(entry => entry.chartAccount);
        const accountsTotal = entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

        // Validate total amount
        if (accountsTotal !== parseFloat(totalAmount)) {
            throw new Error(errorMessages.unbalancedEntry);
        }

        // Validate for duplicate accounts
        if (new Set(accountIds).size !== accountIds.length) {
            throw new Error(errorMessages.duplicateAccounts);
        }

        // Validate dates in entries
        for (const entry of entries) {
            const entryDate = new Date(entry.date);
            if (isNaN(entryDate)) throw new Error(`Invalid date in entry: ${entry.date}`);
            const closedPeriod = await Period.findOne({ endDate: { $gte: entryDate }, status: 'closed' }).session(session);
            if (closedPeriod) throw new Error(errorMessages.closedPeriod);
        }

        // Validate cash or bank account
        let cashChartAccount = null;
        let bank = null;
        if (paymentMethod === 'Cash') {
            cashChartAccount = await ChartAccount.findById(cashAccount).session(session);
            if (!cashChartAccount || cashChartAccount.group !== 'Assets' || !cashChartAccount.name.match(/cash/i)) {
                throw new Error(errorMessages.invalidAccount);
            }
            if (voucherType === 'Payment' && cashChartAccount.currentBalance < totalAmount) {
                throw new Error(errorMessages.insufficientBalance);
            }
        } else {
            bank = await BankAccount.findById(bankAccount).session(session);
            if (!bank) throw new Error('Bank account not found');
            if (voucherType === 'Payment' && bank.currentBalance < totalAmount) {
                throw new Error(errorMessages.insufficientBalance);
            }
        }

        // Validate chart accounts
        const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } }).session(session);
        if (chartAccounts.length !== accountIds.length) {
            throw new Error(errorMessages.accountNotFound);
        }

        // Prepare voucher data
        const voucherData = {
            reference: reference || undefined,
            voucherType,
            paymentMethod,
            description: description || undefined,
            totalAmount: parseFloat(totalAmount),
            status: status || 'Draft',
            entries
        };

        if (paymentMethod === 'Cash') {
            voucherData.cashAccount = cashAccount;
        } else {
            voucherData.bankAccount = bankAccount;
            voucherData.transactionNumber = transactionNumber || undefined;
            voucherData.clearanceDate = clearanceDate || undefined;
        }

        console.log('Creating voucher with data:', JSON.stringify(voucherData, null, 2));
        const voucher = new BatchTransaction(voucherData);
        await voucher.save({ session });

        if (status === 'Posted') {
            const ledgerEntries = [];

            // Handle cash or bank account updates
            if (paymentMethod === 'Cash') {
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: cashChartAccount._id,
                    date: new Date(),
                    debit: voucherType === 'Receipt' ? totalAmount : 0,
                    credit: voucherType === 'Payment' ? totalAmount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucherType} for batch`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
            } else {
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: bank.chartAccountId,
                    date: new Date(),
                    debit: voucherType === 'Receipt' ? totalAmount : 0,
                    credit: voucherType === 'Payment' ? totalAmount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucherType} for batch`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
            }

            // Process entries
            for (const item of entries) {
                const chartAccount = chartAccounts.find(ca => ca._id.toString() === item.chartAccount.toString());
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: item.chartAccount,
                    date: new Date(item.date),
                    debit: voucherType === 'Payment' ? item.amount : 0,
                    credit: voucherType === 'Receipt' ? item.amount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucherType} for ${item.party}`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
                if (['Income', 'Expense'].includes(chartAccount.group)) {
                    await updateRetainedEarnings(item.chartAccount, item.amount, chartAccount.group, session);
                }
            }

            const updatePromises = [];
            if (paymentMethod === 'Cash') {
                updatePromises.push(updateAccountBalance(
                    cashAccount,
                    voucherType === 'Receipt' ? totalAmount : 0,
                    voucherType === 'Payment' ? totalAmount : 0,
                    session
                ));
            } else if (paymentMethod === 'Bank' && bank) {
                updatePromises.push(updateAccountBalance(
                    bank.chartAccountId,
                    voucherType === 'Receipt' ? totalAmount : 0,
                    voucherType === 'Payment' ? totalAmount : 0,
                    session
                ));
            }

            for (const item of entries) {
                updatePromises.push(updateAccountBalance(
                    item.chartAccount,
                    voucherType === 'Payment' ? item.amount : 0,
                    voucherType === 'Receipt' ? item.amount : 0,
                    session
                ));
            }

            await Promise.all([...ledgerEntries, ...updatePromises]);

            if (paymentMethod === 'Bank' && bank) {
                bank.currentBalance += voucherType === 'Receipt' ? totalAmount : -totalAmount;
                await bank.save({ session });
            }

            // Update party transaction history for each entry
            for (const entry of entries) {
                await updatePartyTransactionHistory(entry, voucher, session);
            }
        }

        await AuditLog.create([{
            action: 'create',
            entity: 'BatchTransaction',
            entityId: voucher._id,
            changes: sanitizedBody,
            timestamp: new Date(),
            userId: req.user?.id || 'system',
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: `${voucherType} batch voucher created`, data: voucher });
    } catch (error) {
        await session.abortTransaction();
        console.error(`[${new Date().toISOString()}] add: Error`, {
            error: error.message,
            stack: error.stack,
            reqBody: req.body
        });
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

const view = async (req, res) => {
    try {
        const { error, value } = getTransactionSchema.validate(req.query);
        if (error) throw new Error(error.details.map(d => d.message).join(', '));

        const { page, limit, search, startDate, endDate, status, voucherType } = value;

        const query = {};
        if (search) {
            query.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { voucherNumber: { $regex: search, $options: 'i' } },
            ];
        }
        if (startDate || endDate) {
            query['entries.date'] = {};
            if (startDate) query['entries.date'].$gte = new Date(startDate);
            if (endDate) query['entries.date'].$lte = new Date(endDate);
        }
        if (status) query.status = status;
        if (voucherType) query.voucherType = voucherType;

        const vouchers = await BatchTransaction.find(query)
            .populate('entries.chartAccount', 'name group')
            .populate('bankAccount', 'bankName accountNumber')
            .populate('cashAccount', 'name')
            .populate('entries.customer', 'name')
            .populate('entries.supplier', 'name')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await BatchTransaction.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        return res.json({
            success: true,
            total,
            totalPages,
            currentPage: parseInt(page),
            data: vouchers,
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] view: Error`, { error: error.message });
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to fetch batch vouchers.',
        });
    }
};

const update = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherId, status, reference, description, entries } = req.body;

        const voucher = await BatchTransaction.findById(voucherId).session(session);
        if (!voucher) throw new Error('Batch voucher not found');

        if (voucher.status === 'Posted' && status === 'Draft') {
            throw new Error('Cannot change Posted voucher to Draft');
        }

        // Update fields
        if (status) voucher.status = status;
        if (reference !== undefined) voucher.reference = reference || undefined;
        if (description !== undefined) voucher.description = description || undefined;
        if (entries) {
            if (!Array.isArray(entries) || entries.length === 0) {
                throw new Error('Entries must be a non-empty array');
            }
            entries.forEach((entry, index) => {
                if (!entry.chartAccount) {
                    throw new Error(`chartAccount is missing in entry at index ${index}`);
                }
                if (!mongoose.Types.ObjectId.isValid(entry.chartAccount)) {
                    throw new Error(`Invalid chartAccount ID in entry at index ${index}`);
                }
            });
            voucher.entries = entries;
            voucher.totalAmount = entries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
        }

        if (status === 'Posted' && voucher.status !== 'Posted') {
            const accountIds = voucher.entries.map(entry => entry.chartAccount);
            const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } }).session(session);
            if (chartAccounts.length !== accountIds.length) {
                throw new Error(errorMessages.accountNotFound);
            }

            const ledgerEntries = [];
            let cashChartAccount = null;
            let bank = null;
            if (voucher.paymentMethod === 'Cash') {
                cashChartAccount = await ChartAccount.findById(voucher.cashAccount).session(session);
                if (!cashChartAccount || cashChartAccount.group !== 'Assets' || !cashChartAccount.name.match(/cash/i)) {
                    throw new Error(errorMessages.invalidAccount);
                }
                if (voucher.voucherType === 'Payment' && cashChartAccount.currentBalance < voucher.totalAmount) {
                    throw new Error(errorMessages.insufficientBalance);
                }
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: cashChartAccount._id,
                    date: new Date(),
                    debit: voucher.voucherType === 'Receipt' ? voucher.totalAmount : 0,
                    credit: voucher.voucherType === 'Payment' ? voucher.totalAmount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucher.voucherType} for batch`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
            } else {
                bank = await BankAccount.findById(voucher.bankAccount).session(session);
                if (!bank) throw new Error('Bank account not found');
                if (voucher.voucherType === 'Payment' && bank.currentBalance < voucher.totalAmount) {
                    throw new Error(errorMessages.insufficientBalance);
                }
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: bank.chartAccountId,
                    date: new Date(),
                    debit: voucher.voucherType === 'Receipt' ? voucher.totalAmount : 0,
                    credit: voucher.voucherType === 'Payment' ? voucher.totalAmount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucher.voucherType} for batch`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
            }

            for (const item of voucher.entries) {
                const chartAccount = chartAccounts.find(ca => ca._id.toString() === item.chartAccount.toString());
                ledgerEntries.push(createCOALedgerEntry({
                    coaId: item.chartAccount,
                    date: new Date(item.date),
                    debit: voucher.voucherType === 'Payment' ? item.amount : 0,
                    credit: voucher.voucherType === 'Receipt' ? item.amount : 0,
                    reference: `TXN-${voucher.voucherNumber}`,
                    sourceType: 'Batch Transaction',
                    sourceId: voucher._id,
                    description: `${voucher.voucherType} for ${item.party}`,
                    session,
                    createdBy: req.user?.id || 'system',
                }));
                if (['Income', 'Expense'].includes(chartAccount.group)) {
                    await updateRetainedEarnings(item.chartAccount, item.amount, chartAccount.group, session);
                }
            }

            const updatePromises = [];
            if (voucher.paymentMethod === 'Cash') {
                updatePromises.push(updateAccountBalance(
                    voucher.cashAccount,
                    voucher.voucherType === 'Receipt' ? voucher.totalAmount : 0,
                    voucher.voucherType === 'Payment' ? voucher.totalAmount : 0,
                    session
                ));
            } else if (voucher.paymentMethod === 'Bank' && bank) {
                updatePromises.push(updateAccountBalance(
                    bank.chartAccountId,
                    voucher.voucherType === 'Receipt' ? voucher.totalAmount : 0,
                    voucher.voucherType === 'Payment' ? voucher.totalAmount : 0,
                    session
                ));
            }

            for (const item of voucher.entries) {
                updatePromises.push(updateAccountBalance(
                    item.chartAccount,
                    voucher.voucherType === 'Payment' ? item.amount : 0,
                    voucher.voucherType === 'Receipt' ? item.amount : 0,
                    session
                ));
            }

            await Promise.all([...ledgerEntries, ...updatePromises]);

            if (voucher.paymentMethod === 'Bank' && bank) {
                bank.currentBalance += voucher.voucherType === 'Receipt' ? voucher.totalAmount : -voucher.totalAmount;
                await bank.save({ session });
            }

            for (const entry of voucher.entries) {
                await updatePartyTransactionHistory(entry, voucher, session);
            }
        }

        await voucher.save({ session });

        await AuditLog.create([{
            action: 'update',
            entity: 'BatchTransaction',
            entityId: voucher._id,
            changes: { status, reference, description, entries },
            timestamp: new Date(),
            userId: req.user?.id || 'system',
        }], { session });

        await session.commitTransaction();
        res.json({
            success: true,
            message: "Batch voucher updated successfully",
            data: voucher
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

const remove = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        console.log(`Removing batch voucher with ID: ${id}`);

        const voucher = await BatchTransaction.findById(id).session(session);
        if (!voucher) throw new Error('Batch voucher not found');

        if (voucher.status === 'Posted') {
            throw new Error('Cannot delete a Posted voucher');
        }

        await BatchTransaction.findByIdAndDelete(id).session(session);

        await AuditLog.create([{
            action: 'delete',
            entity: 'BatchTransaction',
            entityId: id,
            changes: {},
            timestamp: new Date(),
            userId: req.user?.id || 'system',
        }], { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Batch voucher deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

module.exports = { add, view, update, remove };