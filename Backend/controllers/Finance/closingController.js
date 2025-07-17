const mongoose = require('mongoose');
const ChartAccount = require('../../models/Finance/chartAccountsModel');
const JournalVoucher = require('../../models/Finance/journalVoucherModel');
const TransactionVoucher = require('../../models/Finance/transactionEntry');
const Period = require('../../models/Finance/periodModel');
const AuditLog = require('../../models/Finance/auditLogModel');
const errorMessages = require('../../utils/errorMessages');

const closePeriod = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { periodEndDate } = req.body;
        if (!periodEndDate) throw new Error(errorMessages.missingFields);

        const endDate = new Date(periodEndDate);
        if (isNaN(endDate)) throw new Error(errorMessages.invalidDate);

        // Check for period overlap
        const overlappingPeriod = await Period.findOne({
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: endDate }
                },
                {
                    startDate: { $lte: new Date(endDate.getFullYear(), endDate.getMonth(), 1) },
                    endDate: { $gte: new Date(endDate.getFullYear(), endDate.getMonth(), 1) }
                }
            ]
        }).session(session);

        if (overlappingPeriod) {
            throw new Error('A period already exists that overlaps with the specified end date');
        }

        // Fetch all chart accounts
        const allAccounts = await ChartAccount.find().session(session);

        let totalIncome = 0;
        let totalExpense = 0;
        const trialBalance = {};

        // Find or create Retained Earnings account
        let retainedEarningsAccount = await ChartAccount.findOne({
            category: 'Retained Earnings',
            group: 'Equity'
        }).session(session);

        if (!retainedEarningsAccount) {
            retainedEarningsAccount = new ChartAccount({
                code: `EQ-RE-${Date.now()}`, // Unique code for new account
                name: 'Retained Earnings',
                group: 'Equity',
                category: 'Retained Earnings',
                nature: 'Credit',
                openingBalance: 0,
                currentBalance: 0,
                createdBy: 'system'
            });
            await retainedEarningsAccount.save({ session });
        }

        // Update balances for each account
        for (const account of allAccounts) {
            const ledger = await getLedgerForAccount(account._id, null, endDate, session);
            const balance = ledger.length > 0 ? ledger[ledger.length - 1].balance : account.openingBalance;

            // Update account's current balance
            account.currentBalance = balance;

            // Reset Income and Expense accounts only
            if (['Income', 'Expense'].includes(account.group)) {
                account.currentBalance = 0;
            }

            await account.save({ session });

            // Update parent account balances if applicable
            await account.calculateAndUpdateParentBalance(session);

            // Build trial balance object
            trialBalance[account.name] = balance;

            // Compute income/expense for net income calculation
            if (account.group === 'Income') totalIncome += balance;
            else if (account.group === 'Expense') totalExpense += balance;
        }

        // Calculate net income and update Retained Earnings
        const netIncome = totalIncome - totalExpense;
        retainedEarningsAccount.currentBalance = (retainedEarningsAccount.currentBalance || 0) + netIncome;
        await retainedEarningsAccount.save({ session });

        // Update parent of Retained Earnings if it has one
        await retainedEarningsAccount.calculateAndUpdateParentBalance(session);

        // Update trial balance with final Retained Earnings balance
        trialBalance[retainedEarningsAccount.name] = retainedEarningsAccount.currentBalance;

        // Save closed period
        const period = new Period({
            startDate: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
            endDate,
            status: 'closed',
            trialBalance,
            netIncome
        });
        await period.save({ session });

        // Create audit log
        await AuditLog.create([{
            action: 'create',
            entity: 'Period',
            entityId: period._id,
            changes: { periodEndDate, trialBalance, netIncome },
            timestamp: new Date()
        }], { session });

        // Calculate implied next period start date
        const nextPeriodStart = new Date(endDate);
        nextPeriodStart.setDate(endDate.getDate() + 1);

        await session.commitTransaction();
        res.json({
            success: true,
            message: 'Period closed successfully',
            data: {
                netIncome,
                trialBalance,
                nextPeriod: {
                    status: 'open',
                    startDate: nextPeriodStart,
                    endDate: null
                }
            }
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error closing period:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to close period'
        });
    } finally {
        session.endSession();
    }
};

// Helper function to calculate ledger for an account
async function getLedgerForAccount(accountId, startDate, endDate, session) {
    const account = await ChartAccount.findById(accountId).lean().session(session);
    const group = account.group;
    const opening = account.openingBalance || 0;

    // Aggregate journal entries
    const journalPipeline = [
        {
            $match: {
                'accounts.account': accountId,
                status: 'Posted',
                ...(startDate || endDate ? {
                    date: {
                        ...(startDate && { $gte: new Date(startDate) }),
                        ...(endDate && { $lte: new Date(endDate) })
                    }
                } : {})
            }
        },
        { $unwind: '$accounts' },
        {
            $match: {
                'accounts.account': accountId
            }
        },
        {
            $project: {
                date: 1,
                debit: '$accounts.debitAmount',
                credit: '$accounts.creditAmount'
            }
        }
    ];

    // Aggregate transaction entries
    const transactionPipeline = [
        {
            $match: {
                $or: [
                    { 'accounts.chartAccount': accountId },
                    { cashAccount: accountId }
                ],
                status: 'Posted',
                ...(startDate || endDate ? {
                    date: {
                        ...(startDate && { $gte: new Date(startDate) }),
                        ...(endDate && { $lte: new Date(endDate) })
                    }
                } : {})
            }
        },
        {
            $lookup: {
                from: 'chartaccounts',
                localField: 'cashAccount',
                foreignField: '_id',
                as: 'cashAccountData'
            }
        },
        {
            $lookup: {
                from: 'chartaccounts',
                localField: 'accounts.chartAccount',
                foreignField: '_id',
                as: 'accountData'
            }
        },
        { $unwind: '$accounts' },
        {
            $match: {
                $or: [
                    { 'accounts.chartAccount': accountId },
                    { cashAccount: accountId }
                ]
            }
        },
        {
            $project: {
                date: 1,
                voucherType: 1,
                totalAmount: 1,
                amount: '$accounts.amount',
                isCashAccount: { $eq: ['$cashAccount', accountId] }
            }
        },
        {
            $group: {
                _id: '$_id',
                date: { $first: '$date' },
                voucherType: { $first: '$voucherType' },
                totalAmount: { $first: '$totalAmount' },
                amount: { $first: '$amount' },
                isCashAccount: { $first: '$isCashAccount' }
            }
        }
    ];

    const [journalEntries, transactionEntries] = await Promise.all([
        JournalVoucher.aggregate(journalPipeline).session(session),
        TransactionVoucher.aggregate(transactionPipeline).session(session)
    ]);

    let runningBalance = opening;
    const ledger = [];

    // Process journal entries
    for (const entry of journalEntries) {
        const debit = entry.debit || 0;
        const credit = entry.credit || 0;
        runningBalance += ['Assets', 'Expense'].includes(group) ? debit - credit : credit - debit;
        ledger.push({ date: entry.date, debit, credit, balance: runningBalance });
    }

    // Process transaction entries
    for (const txn of transactionEntries) {
        const debit = txn.isCashAccount && txn.voucherType === 'Receipt' ? txn.totalAmount :
            !txn.isCashAccount && txn.voucherType === 'Receipt' ? txn.amount : 0;
        const credit = txn.isCashAccount && txn.voucherType === 'Payment' ? txn.totalAmount :
            !txn.isCashAccount && txn.voucherType === 'Payment' ? txn.amount : 0;
        runningBalance += ['Assets', 'Expense'].includes(group) ? debit - credit : credit - debit;
        ledger.push({ date: txn.date, debit, credit, balance: runningBalance });
    }

    return ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = { closePeriod };