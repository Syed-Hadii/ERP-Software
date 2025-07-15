const mongoose = require('mongoose');
const ChartAccount = require('../../models/Finance/chartAccountsModel.js');
const JournalVoucher = require('../../models/Finance/journalVoucherModel');
const Period = require('../../models/Finance/periodModel.js');
const AuditLog = require('../../models/Finance/auditLogModel.js');
const errorMessages = require('../../utils/errorMessages.js');

const closePeriod = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { periodEndDate } = req.body;
        if (!periodEndDate) throw new Error(errorMessages.missingFields);

        const endDate = new Date(periodEndDate);
        if (isNaN(endDate)) throw new Error(errorMessages.invalidDate);

        // Check if period already closed
        const existingPeriod = await Period.findOne({ endDate: endDate }).session(session);
        if (existingPeriod && existingPeriod.status === 'closed') {
            throw new Error(errorMessages.closedPeriod);
        }

        // Generate trial balance
        const trialBalance = await ChartAccount.aggregate([
            { $group: { _id: '$group', totalBalance: { $sum: '$currentBalance' } } }
        ]).session(session);

        const incomeAccounts = await ChartAccount.find({ group: 'Income' }).session(session);
        const expenseAccounts = await ChartAccount.find({ group: 'Expense' }).session(session);
        const retainedEarnings = await ChartAccount.findOne({ category: 'Retained Earnings' }).session(session);
        if (!retainedEarnings) throw new Error('Retained Earnings account not found');

        let totalIncome = 0;
        let totalExpense = 0;
        const journalAccounts = [];

        for (const account of incomeAccounts) {
            const ledger = await getLedgerForAccount(account._id, null, endDate);
            const balance = ledger.length > 0 ? ledger[ledger.length - 1].balance : account.openingBalance;
            if (balance !== 0) {
                totalIncome += balance;
                journalAccounts.push({
                    account: account._id,
                    debitAmount: balance,
                    creditAmount: 0,
                    narration: `Closing ${account.name} for period ending ${endDate.toISOString().split('T')[0]}`,
                });
            }
        }

        for (const account of expenseAccounts) {
            const ledger = await getLedgerForAccount(account._id, null, endDate);
            const balance = ledger.length > 0 ? ledger[ledger.length - 1].balance : account.openingBalance;
            if (balance !== 0) {
                totalExpense += balance;
                journalAccounts.push({
                    account: account._id,
                    debitAmount: 0,
                    creditAmount: balance,
                    narration: `Closing ${account.name} for period ending ${endDate.toISOString().split('T')[0]}`,
                });
            }
        }

        const netIncome = totalIncome - totalExpense;
        if (netIncome !== 0) {
            journalAccounts.push({
                account: retainedEarnings._id,
                debitAmount: netIncome < 0 ? Math.abs(netIncome) : 0,
                creditAmount: netIncome > 0 ? netIncome : 0,
                narration: `Net ${netIncome > 0 ? 'profit' : 'loss'} for period ending ${endDate.toISOString().split('T')[0]}`,
            });
        }

        let journal;
        if (journalAccounts.length > 0) {
            journal = new JournalVoucher({
                date: endDate,
                reference: `CLOSING-${endDate.toISOString().split('T')[0]}`,
                description: `Period closing for ${endDate.toISOString().split('T')[0]}`,
                status: 'Posted',
                accounts: journalAccounts,
            });
            await journal.save({ session });
        }

        // Create or update period
        const period = existingPeriod || new Period({
            startDate: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
            endDate,
            status: 'closed'
        });
        period.status = 'closed';
        await period.save({ session });

        // Log audit trail
        await AuditLog.create({
            action: 'create',
            entity: 'Period',
            entityId: period._id,
            changes: { periodEndDate, trialBalance, netIncome },
            timestamp: new Date()
        }, { session });

        await session.commitTransaction();
        res.json({ success: true, message: 'Period closed successfully', data: { netIncome, trialBalance } });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Helper function (unchanged)
async function getLedgerForAccount(accountId, startDate, endDate) {
    const journalQuery = { 'accounts.account': accountId, status: 'Posted', ...(startDate || endDate ? { date: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } } : {}) };
    const transactionQuery = { $or: [{ 'accounts.chartAccount': accountId }, { cashAccount: accountId }], status: 'Posted', ...(startDate || endDate ? { date: { ...(startDate && { $gte: new Date(startDate) }), ...(endDate && { $lte: new Date(endDate) }) } } : {}) };
    const [journalEntries, transactionEntries] = await Promise.all([
        JournalVoucher.find(journalQuery).lean(),
        TransactionVoucher.find(transactionQuery).populate('bankAccount cashAccount accounts.chartAccount').lean(),
    ]);

    let runningBalance = (await ChartAccount.findById(accountId).lean()).openingBalance || 0;
    const ledger = [];

    for (const entry of journalEntries) {
        for (const line of entry.accounts) {
            if (line.account.toString() === accountId.toString()) {
                const debit = line.debitAmount || 0;
                const credit = line.creditAmount || 0;
                runningBalance += (['Assets', 'Expense'].includes((await ChartAccount.findById(accountId)).group) ? debit - credit : credit - debit);
                ledger.push({ date: entry.date, debit, credit, balance: runningBalance });
            }
        }
    }

    for (const txn of transactionEntries) {
        const isCashAccount = txn.cashAccount && txn.cashAccount._id.toString() === accountId.toString();
        for (const line of txn.accounts) {
            if (line.chartAccount._id.toString() === accountId.toString() || isCashAccount) {
                const debit = txn.voucherType === 'Receipt' && !isCashAccount ? line.amount : (txn.voucherType === 'Receipt' && isCashAccount ? txn.totalAmount : 0);
                const credit = txn.voucherType === 'Payment' && !isCashAccount ? line.amount : (txn.voucherType === 'Payment' && isCashAccount ? txn.totalAmount : 0);
                runningBalance += (['Assets', 'Expense'].includes((await ChartAccount.findById(accountId)).group) ? debit - credit : credit - debit);
                ledger.push({ date: txn.date, debit, credit, balance: runningBalance });
            }
        }
    }

    return ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = { closePeriod };