const mongoose = require("mongoose");
const Customer = require("../../models/Inventory/customerModel");
const Supplier = require("../../models/Inventory/supplierModel");
const Item = require("../../models/Inventory/itemModel");
const Inventory = require("../../models/Inventory/inventory");
const InventoryRequest = require("../../models/Inventory/inventoryRequest");
const PurchaseInvoice = require("../../models/Inventory/PurchaseInvoice");

// Dashboard controller for inventory module
exports.getInventoryDashboard = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ success: false, message: "Invalid page or limit" });
        }

        const skip = (pageNum - 1) * limitNum;

        // 1. Inventory Summary
        const inventorySummary = await Inventory.aggregate([
            {
                $group: {
                    _id: "$owner",
                    totalQuantity: { $sum: "$quantity" },
                    totalCost: { $sum: "$totalCost" },
                    itemCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    owner: "$_id",
                    totalQuantity: 1,
                    totalCost: 1,
                    itemCount: 1,
                    _id: 0,
                },
            },
        ]);

        // 2. Low Stock Alerts
        const lowStockItems = await Inventory.aggregate([
            {
                $lookup: {
                    from: "items",
                    localField: "item",
                    foreignField: "_id",
                    as: "itemDetails",
                },
            },
            { $unwind: "$itemDetails" },
            {
                $match: {
                    $expr: { $lte: ["$quantity", "$itemDetails.lowStockThreshold"] },
                    quantity: { $gt: 0 },
                },
            },
            {
                $project: {
                    itemName: "$itemDetails.name",
                    unit: "$itemDetails.unit",
                    quantity: 1,
                    lowStockThreshold: "$itemDetails.lowStockThreshold",
                    owner: 1,
                },
            },
            { $sort: { quantity: 1 } },
            { $skip: skip },
            { $limit: limitNum },
        ]);

        const totalLowStockItems = await Inventory.aggregate([
            {
                $lookup: {
                    from: "items",
                    localField: "item",
                    foreignField: "_id",
                    as: "itemDetails",
                },
            },
            { $unwind: "$itemDetails" },
            {
                $match: {
                    $expr: { $lte: ["$quantity", "$itemDetails.lowStockThreshold"] },
                    quantity: { $gt: 0 },
                },
            },
            { $count: "total" },
        ]);

        // 3. Pending Inventory Requests
        const pendingRequests = await InventoryRequest.find({ status: "pending" })
            .populate("item", "name unit")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingRequests = await InventoryRequest.countDocuments({ status: "pending" });

        // 4. Recent Transactions (Customer and Supplier)
        const recentCustomerTransactions = await Customer.aggregate([
            { $unwind: "$transactionHistory" },
            { $sort: { "transactionHistory.date": -1 } },
            {
                $project: {
                    customerName: "$name",
                    date: "$transactionHistory.date",
                    type: "$transactionHistory.type",
                    amount: "$transactionHistory.amount",
                    reference: "$transactionHistory.reference",
                    description: "$transactionHistory.description",
                    balance: "$transactionHistory.balance",
                },
            },
            { $limit: 5 },
        ]);

        const recentSupplierTransactions = await Supplier.aggregate([
            { $unwind: "$transactionHistory" },
            { $sort: { "transactionHistory.date": -1 } },
            {
                $project: {
                    supplierName: "$name",
                    date: "$transactionHistory.date",
                    type: "$transactionHistory.type",
                    amount: "$transactionHistory.amount",
                    reference: "$transactionHistory.reference",
                    description: "$transactionHistory.description",
                    balance: "$transactionHistory.balance",
                },
            },
            { $limit: 5 },
        ]);

        // 5. Financial Metrics (Accounts Receivable and Payable)
        const accountsReceivable = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalCurrentBalance: { $sum: "$currentBalance" },
                    totalOpeningBalance: { $sum: "$openingBalance" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalCurrentBalance: 1,
                    totalOpeningBalance: 1,
                },
            },
        ]);

        const accountsPayable = await Supplier.aggregate([
            {
                $group: {
                    _id: null,
                    totalCurrentBalance: { $sum: "$currentBalance" },
                    totalOpeningBalance: { $sum: "$openingBalance" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalCurrentBalance: 1,
                    totalOpeningBalance: 1,
                },
            },
        ]);

        // 6. Recent Purchase Invoices
        const recentInvoices = await PurchaseInvoice.find({ isDeleted: false })
            .populate("supplier", "name")
            .populate("items.item", "name unit")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalInvoices = await PurchaseInvoice.countDocuments({ isDeleted: false });

        // Response
        res.status(200).json({
            success: true,
            data: {
                inventorySummary: inventorySummary || [],
                lowStockAlerts: {
                    total: totalLowStockItems[0]?.total || 0,
                    totalPages: Math.ceil((totalLowStockItems[0]?.total || 0) / limitNum),
                    currentPage: pageNum,
                    items: lowStockItems,
                },
                pendingRequests: {
                    total: totalPendingRequests,
                    totalPages: Math.ceil(totalPendingRequests / limitNum),
                    currentPage: pageNum,
                    requests: pendingRequests,
                },
                recentTransactions: {
                    customers: recentCustomerTransactions,
                    suppliers: recentSupplierTransactions,
                },
                financialMetrics: {
                    accountsReceivable: accountsReceivable[0] || { totalCurrentBalance: 0, totalOpeningBalance: 0 },
                    accountsPayable: accountsPayable[0] || { totalCurrentBalance: 0, totalOpeningBalance: 0 },
                },
                recentInvoices: {
                    total: totalInvoices,
                    totalPages: Math.ceil(totalInvoices / limitNum),
                    currentPage: pageNum,
                    invoices: recentInvoices,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching dashboard data: ${error.message}` });
    }
};
