const mongoose = require("mongoose");
const ChartAccount = require("../../models/Finance/chartAccountsModel");
const BankAccount = require("../../models/Finance/bankAccountModel");
const JournalVoucher = require("../../models/Finance/journalVoucherModel");
const TransactionVoucher = require("../../models/Finance/transactionEntry");
const Period = require("../../models/Finance/periodModel");
const Customer = require("../../models/Inventory/customerModel");
const Supplier = require("../../models/Inventory/supplierModel");
const Inventory = require("../../models/Inventory/inventory");
const DairyInventory = require("../../models/Cattle/dairyInventory");
const AgroInventory = require("../../models/Agriculture/agroInventory");
const PurchaseInvoice = require("../../models/Inventory/purchaseInvoice");
const DairySales = require("../../models/Cattle/dairySales");

// Helper function to calculate group totals
const getGroupTotals = async (session) => {
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
        ]).session(session);
        totals[group] = result.length > 0 ? result[0].totalCurrentBalance : 0;
    }

    const bankBalances = await BankAccount.aggregate([
        {
            $group: {
                _id: null,
                totalBankBalance: { $sum: "$currentBalance" }
            }
        }
    ]).session(session);
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
        type: tx.voucherType || tx.invoiceNumber ? (tx.invoiceNumber?.startsWith("PI") ? "PurchaseInvoice" : "SalesInvoice") : "Journal",
        reference: tx.reference || tx.voucherNumber || tx.invoiceNumber || "-",
        description: tx.description || tx.notes || "-",
        amount: tx.totalAmount || tx.totalPrice || tx.accounts?.reduce((sum, acc) => sum + (acc.debitAmount || acc.creditAmount || acc.amount || 0), 0) || 0,
        status: tx.status || tx.paymentStatus || "-",
        entity: tx.invoiceNumber ? (tx.invoiceNumber.startsWith("PI") ? "PurchaseInvoice" : "SalesInvoice") : (tx.voucherType ? "TransactionVoucher" : "JournalVoucher")
    }));
};

// Helper function to get top inventory items
const getTopInventoryItems = async (session, limit = 5) => {
    const [generalItems, dairyItems, agroItems] = await Promise.all([
        Inventory.find()
            .sort({ totalCost: -1 })
            .limit(limit)
            .populate("item", "name")
            .lean()
            .session(session),
        DairyInventory.find()
            .sort({ totalCost: -1 })
            .limit(limit)
            .populate("productId", "name")
            .lean()
            .session(session),
        AgroInventory.find()
            .sort({ totalCost: -1 })
            .limit(limit)
            .populate("crop", "name")
            .lean()
            .session(session)
    ]);

    return {
        general: generalItems.map(item => ({
            id: item._id,
            name: item.item?.name || "-",
            quantity: item.quantity,
            totalCost: item.totalCost
        })),
        dairy: dairyItems.map(item => ({
            id: item._id,
            name: item.productId?.name || "-",
            quantity: item.quantity,
            totalCost: item.totalCost
        })),
        agro: agroItems.map(item => ({
            id: item._id,
            name: item.crop?.name || "-",
            quantity: item.quantity,
            totalCost: item.totalCost
        }))
    };
};

// Helper function to get recent invoices
const getRecentInvoices = async (session, limit = 5) => {
    const [purchaseInvoices, salesInvoices] = await Promise.all([
        PurchaseInvoice.find({ isDeleted: false, status: { $ne: "rejected" } })
            .populate("supplier", "name")
            .sort({ date: -1 })
            .limit(limit)
            .lean()
            .session(session),
        DairySales.find({ isDeleted: false, status: { $ne: "rejected" } })
            .populate("customer", "name")
            .sort({ date: -1 })
            .limit(limit)
            .lean()
            .session(session)
    ]);

    return [...purchaseInvoices, ...salesInvoices]
        .map(inv => ({
            id: inv._id,
            invoiceNumber: inv.invoiceNumber || inv.reference || "-",
            date: inv.date,
            party: inv.supplier?.name || inv.customer?.name || "-",
            type: inv.invoiceNumber?.startsWith("PI") ? "Purchase" : "Sale",
            totalAmount: inv.totalAmount || inv.totalPrice || 0,
            status: inv.status
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
};

// Main dashboard controller
const getDashboardData = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Fetch group totals
        const groupTotals = await getGroupTotals(session);

        // Fetch bank account summaries
        const bankAccounts = await BankAccount.find()
            .select("bankName accountTitle accountNumber currentBalance")
            .lean()
            .session(session);

        // Fetch customer and supplier summaries
        const [customerSummary, supplierSummary] = await Promise.all([
            Customer.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBalance: { $sum: "$currentBalance" },
                        count: { $sum: 1 }
                    }
                }
            ]).session(session),
            Supplier.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBalance: { $sum: "$currentBalance" },
                        count: { $sum: 1 }
                    }
                }
            ]).session(session)
        ]);

        // Fetch inventory summaries
        const [generalInventory, dairyInventory, agroInventory] = await Promise.all([
            Inventory.aggregate([
                { $match: { quantity: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        totalQty: { $sum: "$quantity" },
                        totalValue: { $sum: "$totalCost" }
                    }
                }
            ]).session(session),
            DairyInventory.aggregate([
                { $match: { quantity: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        totalQty: { $sum: "$quantity" },
                        totalValue: { $sum: "$totalCost" }
                    }
                }
            ]).session(session),
            AgroInventory.aggregate([
                { $match: { quantity: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        totalQty: { $sum: "$quantity" },
                        totalValue: { $sum: "$totalCost" }
                    }
                }
            ]).session(session)
        ]);

        // Fetch top inventory items
        const topInventoryItems = await getTopInventoryItems(session, 5);

        // Fetch recent transactions and invoices
        const [journalEntries, transactionVouchers, recentInvoices] = await Promise.all([
            JournalVoucher.find({ status: "Posted" })
                .sort({ date: -1 })
                .limit(5)
                .lean()
                .session(session),
            TransactionVoucher.find({ status: "Posted" })
                .sort({ date: -1 })
                .limit(5)
                .lean()
                .session(session),
            getRecentInvoices(session, 5)
        ]);

        const recentTransactions = formatRecentTransactions([
            ...journalEntries,
            ...transactionVouchers,
            ...recentInvoices
        ]).slice(0, 10);

        // Fetch category breakdown
        const categoryBreakdown = await ChartAccount.aggregate([
            { $match: { category: { $ne: null } } },
            { $group: { _id: "$category", totalCurrentBalance: { $sum: "$currentBalance" } } },
            { $sort: { _id: 1 } }
        ]).session(session);

        // Calculate total cash flow
        const cashFlow = await TransactionVoucher.aggregate([
            { $match: { status: "Posted" } },
            {
                $group: {
                    _id: null,
                    totalReceipts: {
                        $sum: { $cond: [{ $eq: ["$voucherType", "Receipt"] }, "$totalAmount", 0] }
                    },
                    totalPayments: {
                        $sum: { $cond: [{ $eq: ["$voucherType", "Payment"] }, "$totalAmount", 0] }
                    }
                }
            },
            {
                $project: {
                    totalCashFlow: { $subtract: ["$totalReceipts", "$totalPayments"] }
                }
            }
        ]).session(session);

        // Fetch current accounting period
        const latestClosedPeriod = await Period.findOne()
            .sort({ endDate: -1 })
            .select("endDate")
            .lean()
            .session(session);

        let currentPeriod = { status: "open", startDate: new Date(2020, 0, 1), endDate: null };
        if (latestClosedPeriod) {
            const nextStart = new Date(latestClosedPeriod.endDate);
            nextStart.setDate(latestClosedPeriod.endDate.getDate() + 1);
            currentPeriod = {
                status: "open",
                startDate: nextStart,
                endDate: null
            };
        }

        // Calculate key metrics
        const totalAssets = groupTotals.Assets || 0;
        const totalLiabilities = groupTotals.Liabilities || 0;
        const totalEquity = groupTotals.Equity || 0;
        const totalIncome = groupTotals.Income || 0;
        const totalExpenses = groupTotals.Expense || 0;
        const netIncome = totalIncome - totalExpenses;

        await session.commitTransaction();
        res.status(200).json({
            success: true,
            data: {
                financialSummary: {
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    netIncome,
                    totalBankBalance: bankAccounts.reduce((sum, bank) => sum + bank.currentBalance, 0),
                    totalCashFlow: cashFlow[0]?.totalCashFlow || 0
                },
                bankAccounts: bankAccounts.map(bank => ({
                    bankName: bank.bankName,
                    accountTitle: bank.accountTitle,
                    accountNumber: bank.accountNumber,
                    currentBalance: bank.currentBalance
                })),
                recentTransactions,
                categoryBreakdown: categoryBreakdown.map(cat => ({
                    category: cat._id,
                    total: cat.totalCurrentBalance
                })),
                customerSummary: {
                    totalBalance: customerSummary[0]?.totalBalance || 0,
                    totalCustomers: customerSummary[0]?.count || 0
                },
                supplierSummary: {
                    totalBalance: supplierSummary[0]?.totalBalance || 0,
                    totalSuppliers: supplierSummary[0]?.count || 0
                },
                inventorySummary: {
                    totalItems: (generalInventory[0]?.totalItems || 0) + (dairyInventory[0]?.totalItems || 0) + (agroInventory[0]?.totalItems || 0),
                    totalQty: (generalInventory[0]?.totalQty || 0) + (dairyInventory[0]?.totalQty || 0) + (agroInventory[0]?.totalQty || 0),
                    totalValue: (generalInventory[0]?.totalValue || 0) + (dairyInventory[0]?.totalValue || 0) + (agroInventory[0]?.totalValue || 0)
                },
                topInventoryItems,
                recentWriteOffs: [], // Placeholder: No InventoryWriteOff model available
                currentPeriod
            }
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// Fetch detailed account breakdown by group
const getAccountBreakdown = async (req, res) => {
    try {
        const { group } = req.params;
        if (!["Assets", "Liabilities", "Equity", "Income", "Expense"].includes(group)) {
            return res.status(400).json({
                success: false,
                message: "Invalid group specified"
            });
        }

        const accounts = await ChartAccount.find({ group })
            .select("name category currentBalance openingBalance")
            .lean();

        res.status(200).json({
            success: true,
            data: accounts.map(acc => ({
                name: acc.name,
                category: acc.category || "-",
                currentBalance: acc.currentBalance,
                openingBalance: acc.openingBalance
            }))
        });
    } catch (error) {
        console.error("Error fetching account breakdown:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch account breakdown",
            error: error.message
        });
    }
};

// Fetch transaction or invoice details by ID
const getTransactionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        let transaction;

        // Try TransactionVoucher
        transaction = await TransactionVoucher.findById(id)
            .populate("bankAccount", "bankName accountNumber")
            .populate("cashAccount", "name")
            .populate("customer", "name")
            .populate("supplier", "name")
            .populate("accounts.chartAccount", "name")
            .lean();

        if (!transaction) {
            // Try JournalVoucher
            transaction = await JournalVoucher.findById(id)
                .populate("accounts.account", "name")
                .lean();
        }

        if (!transaction) {
            // Try PurchaseInvoice
            transaction = await PurchaseInvoice.findById(id)
                .populate("supplier", "name")
                .populate("items.item", "name")
                .lean();
        }

        if (!transaction) {
            // Try DairySales
            transaction = await DairySales.findById(id)
                .populate("customer", "name")
                .populate("items.item", "name")
                .lean();
        }

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction or invoice not found"
            });
        }

        let formattedTransaction;
        if (transaction.invoiceNumber || transaction.reference?.startsWith("PI") || transaction.items?.[0]?.item) {
            // Handle Invoices
            formattedTransaction = {
                id: transaction._id,
                date: transaction.date,
                type: transaction.invoiceNumber?.startsWith("PI") ? "PurchaseInvoice" : "SalesInvoice",
                reference: transaction.reference || transaction.invoiceNumber || "-",
                description: transaction.description || transaction.notes || "-",
                status: transaction.status,
                party: transaction.customer?.name || transaction.supplier?.name || "-",
                totalAmount: transaction.totalAmount || transaction.totalPrice || 0,
                items: transaction.items?.map(item => ({
                    itemName: item.item?.name || "-",
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discountPercent || 0
                })) || []
            };
        } else {
            // Handle Vouchers
            formattedTransaction = {
                id: transaction._id,
                date: transaction.date,
                type: transaction.voucherType || "Journal",
                reference: transaction.reference || transaction.voucherNumber || "-",
                description: transaction.description || "-",
                status: transaction.status,
                accounts: transaction.accounts?.map(acc => ({
                    accountName: acc.chartAccount?.name || acc.account?.name || "-",
                    debit: acc.debitAmount || acc.amount || 0,
                    credit: acc.creditAmount || 0,
                    narration: acc.narration || "-"
                })) || [],
                paymentMethod: transaction.paymentMethod || "-",
                bankAccount: transaction.bankAccount ? {
                    bankName: transaction.bankAccount.bankName,
                    accountNumber: transaction.bankAccount.accountNumber
                } : null,
                cashAccount: transaction.cashAccount?.name || null,
                party: transaction.customer?.name || transaction.supplier?.name || transaction.party || "-",
                totalAmount: transaction.totalAmount || transaction.accounts?.reduce((sum, acc) => sum + (acc.debitAmount || acc.amount || 0), 0) || 0
            };
        }

        res.status(200).json({
            success: true,
            data: formattedTransaction
        });
    } catch (error) {
        console.error("Error fetching transaction details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction details",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardData,
    getAccountBreakdown,
    getTransactionDetails
};