const mongoose = require("mongoose");
const ChartAccount = require("../../models/Finance/chartAccountsModel");
const BankAccount = require("../../models/Finance/bankAccountModel");
const JournalVoucher = require("../../models/Finance/journalVoucherModel");
const TransactionVoucher = require("../../models/Finance/transactionEntry");

// Helper function to calculate group totals
const getGroupTotals = async () => {
    const groups = ["Assets", "Liabilities", "Equity", "Income", "Expense"];
    const totals = {};

    for (const group of groups) {
        const result = await ChartAccount.aggregate([
            { $match: { group } },
            {
                $group: {
                    _id: null,
                    totalCurrentBalance: { $sum: "$currentBalance" },
                },
            },
        ]);
        totals[group] = result.length > 0 ? result[0].totalCurrentBalance : 0;
    }

    // Add bank balances to Assets total
    const bankBalances = await BankAccount.aggregate([
        {
            $group: {
                _id: null,
                totalBankBalance: { $sum: "$currentBalance" }
            }
        }
    ]);

    if (bankBalances.length > 0) {
        totals["Assets"] += bankBalances[0].totalBankBalance;
    }

    return totals;
};

// Helper function to format recent transactions
const formatRecentTransactions = (transactions) => {
    return transactions.map((tx) => ({
        id: tx._id,
        date: tx.date,
        type: tx.voucherType || "Journal",
        reference: tx.reference || tx.voucherNumber || "-",
        description: tx.description || "-",
        amount: tx.totalAmount || tx.accounts.reduce((sum, acc) => sum + (acc.debitAmount || acc.creditAmount || 0), 0),
        status: tx.status,
    }));
};

// Dashboard Controller
const getDashboardData = async (req, res) => {
    try {
        // Fetch group totals
        const groupTotals = await getGroupTotals();

        // Fetch bank account summaries
        const bankAccounts = await BankAccount.find()
            .select("bankName accountTitle accountNumber currentBalance")
            .lean();
        const bankSummary = bankAccounts.map((bank) => ({
            bankName: bank.bankName,
            accountTitle: bank.accountTitle,
            accountNumber: bank.accountNumber,
            currentBalance: bank.currentBalance,
        }));

        // Fetch recent transactions (last 10 from both JournalVoucher and TransactionVoucher)
        const journalEntries = await JournalVoucher.find({ status: "Posted" })
            .sort({ date: -1 })
            .limit(5)
            .lean();
        const transactionVouchers = await TransactionVoucher.find({ status: "Posted" })
            .sort({ date: -1 })
            .limit(5)
            .lean();
        const recentTransactions = formatRecentTransactions([
            ...journalEntries,
            ...transactionVouchers,
        ]).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        // Fetch category breakdowns
        const categoryBreakdown = await ChartAccount.aggregate([
            { $group: { _id: "$category", totalCurrentBalance: { $sum: "$currentBalance" } } },
            { $sort: { _id: 1 } },
        ]);

        // Calculate key metrics
        const totalAssets = groupTotals.Assets || 0;
        const totalLiabilities = groupTotals.Liabilities || 0;
        const totalEquity = groupTotals.Equity || 0;
        const totalIncome = groupTotals.Income || 0;
        const totalExpenses = groupTotals.Expense || 0;
        const netIncome = totalIncome - totalExpenses;

        // Response
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    netIncome,
                    totalBankBalance: bankSummary.reduce((sum, bank) => sum + bank.currentBalance, 0),
                },
                bankAccounts: bankSummary,
                recentTransactions,
                categoryBreakdown: categoryBreakdown.map((cat) => ({
                    category: cat._id,
                    total: cat.totalCurrentBalance,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

// Fetch detailed account breakdown by group
const getAccountBreakdown = async (req, res) => {
    try {
        const { group } = req.params;
        if (!["Assets", "Liabilities", "Equity", "Income", "Expense"].includes(group)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group specified",
            });
        }

        const accounts = await ChartAccount.find({ group })
            .select("name category currentBalance openingBalance")
            .lean();

        res.status(200).json({
            success: true,
            data: accounts.map((acc) => ({
                name: acc.name,
                category: acc.category,
                currentBalance: acc.currentBalance,
                openingBalance: acc.openingBalance,
            })),
        });
    } catch (error) {
        console.error("Error fetching account breakdown:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch account breakdown",
            error: error.message,
        });
    }
};

// Fetch transaction details by ID
const getTransactionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        let transaction;

        // Try finding in TransactionVoucher first
        transaction = await TransactionVoucher.findById(id)
            .populate("bankAccount", "bankName accountNumber")
            .populate("cashAccount", "name")
            .populate("accounts.chartAccount", "name")
            .lean();

        if (!transaction) {
            // Try finding in JournalVoucher
            transaction = await JournalVoucher.findById(id)
                .populate("accounts.account", "name")
                .lean();
        }

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        const formattedTransaction = {
            id: transaction._id,
            date: transaction.date,
            type: transaction.voucherType || "Journal",
            reference: transaction.reference || transaction.voucherNumber || "-",
            description: transaction.description || "-",
            status: transaction.status,
            accounts: transaction.accounts.map((acc) => ({
                accountName: acc.chartAccount?.name || acc.account?.name || "-",
                debit: acc.debitAmount || acc.amount || 0,
                credit: acc.creditAmount || 0,
                narration: acc.narration || "-",
            })),
            paymentMethod: transaction.paymentMethod || "-",
            bankAccount: transaction.bankAccount
                ? {
                    bankName: transaction.bankAccount.bankName,
                    accountNumber: transaction.bankAccount.accountNumber,
                }
                : null,
            cashAccount: transaction.cashAccount ? transaction.cashAccount.name : null,
            party: transaction.party || "-",
            totalAmount: transaction.totalAmount || transaction.accounts.reduce((sum, acc) => sum + (acc.debitAmount || acc.amount || 0), 0),
        };

        res.status(200).json({
            success: true,
            data: formattedTransaction,
        });
    } catch (error) {
        console.error("Error fetching transaction details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction details",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardData,
    getAccountBreakdown,
    getTransactionDetails,
};