const mongoose = require("mongoose");
const Farmer = require("../models/Agriculture/farmer");
const Land = require("../models/Agriculture/landModel");
const Crop_Sow = require("../models/Agriculture/crop-sow");
const { IrrigationSchedule, FertilizationSchedule, PesticideSchedule } = require("../models/Agriculture/crop_schedules");
const CattleRegister = require("../models/Cattle/cattle-Register");
const MilkProduction = require("../models/Cattle/milkProduction");
const DairyProcessing = require("../models/Cattle/dairyProcessing");
const HealthEvent = require("../models/Cattle/healthEvent");
const DairySales = require("../models/Cattle/dairySales");
const Inventory = require("../models/Inventory/inventory");
const InventoryRequest = require("../models/Inventory/inventoryRequest");
const Employee = require("../models/HR/employees");
const Attendance = require("../models/HR/attendance");
const Payroll = require("../models/HR/payroll");
const PayrollRequest = require("../models/HR/payrollRequest");
const Loan = require("../models/HR/loan");
const ChartAccount = require("../models/Finance/chartAccountsModel");
const BankAccount = require("../models/Finance/bankAccountModel");
const JournalVoucher = require("../models/Finance/journalVoucherModel");
const TransactionVoucher = require("../models/Finance/transactionEntry");

exports.getAdminDashboard = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ success: false, message: "Invalid page or limit" });
        }

        const skip = (pageNum - 1) * limitNum;
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        // 1. Summary Metrics
        const [
            totalFarmers,
            totalLands,
            totalActiveCrops,
            totalCattle,
            totalMilkVolume,
            totalPendingProcessing,
            totalInventoryItems,
            totalLowStockItems,
            totalEmployees,
            totalPayrollAmount,
            totalOutstandingLoans,
            financialTotals,
            totalBankBalance,
        ] = await Promise.all([
            // Agriculture
            Farmer.countDocuments(),
            Land.countDocuments(),
            Crop_Sow.countDocuments({ cropStatus: { $in: ["Planned", "Active"] } }),
            // Cattle & Dairy
            CattleRegister.countDocuments({ status: "active" }),
            MilkProduction.aggregate([
                { $match: { date: { $gte: thirtyDaysAgo, $lte: today } } },
                { $group: { _id: null, totalVolume: { $sum: "$volume" } } },
                { $project: { totalVolume: 1, _id: 0 } },
            ]).then(result => result[0]?.totalVolume || 0),
            DairyProcessing.countDocuments({ status: "pending" }),
            // Inventory
            Inventory.countDocuments(),
            Inventory.aggregate([
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
            ]).then(result => result[0]?.total || 0),
            // HR
            Employee.countDocuments({ status: "active" }),
            Payroll.aggregate([
                {
                    $match: {
                        $and: [
                            { $expr: { $eq: [{ $year: "$createdAt" }, { $year: new Date() }] } },
                            { $expr: { $eq: [{ $month: "$createdAt" }, { $month: new Date() }] } },
                        ],
                    },
                },
                { $group: { _id: null, totalAmount: { $sum: "$netPay" } } },
                { $project: { totalAmount: 1, _id: 0 } },
            ]).then(result => result[0]?.totalAmount || 0),
            Loan.aggregate([
                { $match: { isPaid: false, type: "Employee" } },
                { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
                { $project: { totalAmount: 1, _id: 0 } },
            ]).then(result => result[0]?.totalAmount || 0),
            // Finance
            ChartAccount.aggregate([
                { $group: { _id: "$group", totalCurrentBalance: { $sum: "$currentBalance" } } },
            ]).then(result => {
                const totals = { Assets: 0, Liabilities: 0, Equity: 0, Income: 0, Expense: 0 };
                result.forEach(item => (totals[item._id] = item.totalCurrentBalance));
                return totals;
            }),
            BankAccount.aggregate([
                { $group: { _id: null, totalBankBalance: { $sum: "$currentBalance" } } },
                { $project: { totalBankBalance: 1, _id: 0 } },
            ]).then(result => result[0]?.totalBankBalance || 0),
        ]);

        // 2. Pending Actions (Consolidated)
        const pendingActions = await Promise.all([
            // Agriculture Schedules
            IrrigationSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [{ path: "crop", select: "name" }, { path: "farmer", select: "name" }],
                })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(schedules =>
                    schedules.map(s => ({ module: "Agriculture", type: "Irrigation Schedule", id: s._id, details: `Crop: ${s.crop?.crop?.name}, Farmer: ${s.crop?.farmer?.name}` })),
                ),
            FertilizationSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [{ path: "crop", select: "name" }, { path: "farmer", select: "name" }],
                })
                .populate("fertilizer", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(schedules =>
                    schedules.map(s => ({
                        module: "Agriculture",
                        type: "Fertilization Schedule",
                        id: s._id,
                        details: `Crop: ${s.crop?.crop?.name}, Fertilizer: ${s.fertilizer?.name}`,
                    })),
                ),
            PesticideSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [{ path: "crop", select: "name" }, { path: "farmer", select: "name" }],
                })
                .populate("pesticide", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(schedules =>
                    schedules.map(s => ({
                        module: "Agriculture",
                        type: "Pesticide Schedule",
                        id: s._id,
                        details: `Crop: ${s.crop?.crop?.name}, Pesticide: ${s.pesticide?.name}`,
                    })),
                ),
            // Cattle & Dairy
            DairyProcessing.find({ status: "pending" })
                .populate("rawMilkProductId", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(processes =>
                    processes.map(p => ({
                        module: "Cattle & Dairy",
                        type: "Dairy Processing",
                        id: p._id,
                        details: `Product: ${p.rawMilkProductId?.name}`,
                    })),
                ),
            HealthEvent.find({ status: "Pending", nextDueDate: { $gte: today, $lte: nextWeek } })
                .populate("cattleId", "cattleId")
                .sort({ nextDueDate: 1 })
                .skip(skip)
                .limit(limitNum)
                .then(events =>
                    events.map(e => ({
                        module: "Cattle & Dairy",
                        type: "Health Event",
                        id: e._id,
                        details: `Cattle: ${e.cattleId?.cattleId}, Due: ${new Date(e.nextDueDate).toLocaleDateString()}`,
                    })),
                ),
            DairySales.find({ status: "pending", isDeleted: false })
                .populate("customer", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(sales =>
                    sales.map(s => ({
                        module: "Cattle & Dairy",
                        type: "Dairy Sale",
                        id: s._id,
                        details: `Customer: ${s.customer?.name}, Amount: $${s.totalPrice}`,
                    })),
                ),
            // Inventory
            InventoryRequest.find({ status: "pending" })
                .populate("item", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(requests =>
                    requests.map(r => ({
                        module: "Inventory",
                        type: "Inventory Request",
                        id: r._id,
                        details: `Item: ${r.item?.name}, Quantity: ${r.quantity}`,
                    })),
                ),
            // HR
            PayrollRequest.find({ status: "Pending" })
                .populate({
                    path: "payrolls",
                    populate: { path: "employee", select: "firstName lastName" },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .then(requests =>
                    requests.map(r => ({
                        module: "HR",
                        type: "Payroll Request",
                        id: r._id,
                        details: `Month: ${r.month}/${r.year}, Amount: $${r.totalAmount}`,
                    })),
                ),
        ]);

        const totalPendingActions = await Promise.all([
            IrrigationSchedule.countDocuments({ status: "pending" }),
            FertilizationSchedule.countDocuments({ status: "pending" }),
            PesticideSchedule.countDocuments({ status: "pending" }),
            DairyProcessing.countDocuments({ status: "pending" }),
            HealthEvent.countDocuments({ status: "Pending", nextDueDate: { $gte: today, $lte: nextWeek } }),
            DairySales.countDocuments({ status: "pending", isDeleted: false }),
            InventoryRequest.countDocuments({ status: "pending" }),
            PayrollRequest.countDocuments({ status: "Pending" }),
        ]).then(counts => counts.reduce((sum, count) => sum + count, 0));

        const pendingActionsList = pendingActions.flat().sort((a, b) => b.id.getTimestamp() - a.id.getTimestamp()).slice(0, limitNum);

        // 3. Recent Transactions
        const journalEntries = await JournalVoucher.find({ status: "Posted" })
            .sort({ date: -1 })
            .limit(5)
            .lean();
        const transactionVouchers = await TransactionVoucher.find({ status: "Posted" })
            .sort({ date: -1 })
            .limit(5)
            .lean();
        const recentTransactions = [...journalEntries, ...transactionVouchers]
            .map(tx => ({
                id: tx._id,
                date: tx.date,
                type: tx.voucherType || "Journal",
                reference: tx.reference || tx.voucherNumber || "-",
                description: tx.description || "-",
                amount: tx.totalAmount || tx.accounts.reduce((sum, acc) => sum + (acc.debitAmount || acc.amount || 0), 0),
                status: tx.status,
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        // 4. Revenue and Expense Trends (Last 30 Days)
        const trends = await Promise.all([
            JournalVoucher.aggregate([
                { $match: { date: { $gte: thirtyDaysAgo, $lte: today }, status: "Posted" } },
                { $unwind: "$accounts" },
                {
                    $lookup: {
                        from: "chartaccounts",
                        localField: "accounts.account",
                        foreignField: "_id",
                        as: "accountDetails",
                    },
                },
                { $unwind: "$accountDetails" },
                {
                    $match: {
                        $or: [{ "accountDetails.group": "Income" }, { "accountDetails.group": "Expense" }],
                    },
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            group: "$accountDetails.group",
                        },
                        total: { $sum: "$accounts.debitAmount" },
                    },
                },
                {
                    $group: {
                        _id: "$_id.date",
                        data: {
                            $push: {
                                group: "$_id.group",
                                total: "$total",
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            TransactionVoucher.aggregate([
                { $match: { date: { $gte: thirtyDaysAgo, $lte: today }, status: "Posted" } },
                { $unwind: "$accounts" },
                {
                    $lookup: {
                        from: "chartaccounts",
                        localField: "accounts.chartAccount",
                        foreignField: "_id",
                        as: "accountDetails",
                    },
                },
                { $unwind: "$accountDetails" },
                {
                    $match: {
                        $or: [{ "accountDetails.group": "Income" }, { "accountDetails.group": "Expense" }],
                    },
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            group: "$accountDetails.group",
                        },
                        total: { $sum: "$accounts.debitAmount" },
                    },
                },
                {
                    $group: {
                        _id: "$_id.date",
                        data: {
                            $push: {
                                group: "$_id.group",
                                total: "$total",
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const trendData = {};
        [...trends[0], ...trends[1]].forEach(item => {
            if (!trendData[item._id]) {
                trendData[item._id] = { Income: 0, Expense: 0 };
            }
            item.data.forEach(d => {
                trendData[item._id][d.group] = d.total;
            });
        });

        const revenueExpenseTrends = Object.keys(trendData)
            .sort()
            .map(date => ({
                date,
                revenue: trendData[date].Income || 0,
                expense: trendData[date].Expense || 0,
            }));

        // 5. Task Analytics (Same as HR Dashboard)
        const taskAnalytics = await Employee.aggregate([
            { $match: { status: "active" } },
            {
                $lookup: {
                    from: "cropschedules",
                    let: { employeeId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$employee", "$$employeeId"] },
                                date: { $gte: thirtyDaysAgo, $lte: today },
                            },
                        },
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "cropTasks",
                },
            },
            {
                $lookup: {
                    from: "milkproductions",
                    let: { employeeId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$employee", "$$employeeId"] },
                                date: { $gte: thirtyDaysAgo, $lte: today },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "milkTasks",
                },
            },
            {
                $lookup: {
                    from: "feedprocesses",
                    let: { employeeId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$operator", "$$employeeId"] },
                                createdAt: { $gte: thirtyDaysAgo, $lte: today },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "feedProcessTasks",
                },
            },
            {
                $lookup: {
                    from: "feedusages",
                    let: { employeeId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$operator", "$$employeeId"] },
                                createdAt: { $gte: thirtyDaysAgo, $lte: today },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "feedUsageTasks",
                },
            },
            {
                $lookup: {
                    from: "dairyprocessings",
                    let: { employeeId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$employee", "$$employeeId"] },
                                date: { $gte: thirtyDaysAgo, $lte: today },
                            },
                        },
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "dairyProcessingTasks",
                },
            },
            {
                $project: {
                    employeeId: "$_id",
                    name: { $concat: ["$firstName", " ", "$lastName"] },
                    department: 1,
                    tasks: {
                        pending: {
                            $add: [
                                {
                                    $let: {
                                        vars: {
                                            filtered: { $filter: { input: "$cropTasks", as: "task", cond: { $eq: ["$$task._id", "Pending"] } } }
                                        },
                                        in: { $ifNull: [{ $arrayElemAt: ["$$filtered.count", 0] }, 0] }
                                    }
                                },
                                {
                                    $let: {
                                        vars: {
                                            filtered: { $filter: { input: "$dairyProcessingTasks", as: "task", cond: { $eq: ["$$task._id", "pending"] } } }
                                        },
                                        in: { $ifNull: [{ $arrayElemAt: ["$$filtered.count", 0] }, 0] }
                                    }
                                }
                            ]
                        },
                        completed: {
                            $add: [
                                {
                                    $let: {
                                        vars: {
                                            filtered: { $filter: { input: "$cropTasks", as: "task", cond: { $eq: ["$$task._id", "Completed"] } } }
                                        },
                                        in: { $ifNull: [{ $arrayElemAt: ["$$filtered.count", 0] }, 0] }
                                    }
                                },
                                {
                                    $let: {
                                        vars: {
                                            filtered: { $filter: { input: "$dairyProcessingTasks", as: "task", cond: { $eq: ["$$task._id", "completed"] } } }
                                        },
                                        in: { $ifNull: [{ $arrayElemAt: ["$$filtered.count", 0] }, 0] }
                                    }
                                }
                            ]
                        },
                        inProgress: {
                            $let: {
                                vars: {
                                    filtered: { $filter: { input: "$cropTasks", as: "task", cond: { $eq: ["$$task._id", "InProgress"] } } }
                                },
                                in: { $ifNull: [{ $arrayElemAt: ["$$filtered.count", 0] }, 0] }
                            }
                        }
                    },
                    milkTasks: { $ifNull: [{ $arrayElemAt: ["$milkTasks.count", 0] }, 0] },
                    feedProcessTasks: { $ifNull: [{ $arrayElemAt: ["$feedProcessTasks.count", 0] }, 0] },
                    feedUsageTasks: { $ifNull: [{ $arrayElemAt: ["$feedUsageTasks.count", 0] }, 0] }
                }
            },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limitNum }
        ]);
        const totalTaskAnalytics = await Employee.countDocuments({ status: "active" });

        // 6. Pending Actions Summary (for Pie Chart)
        const pendingActionsSummary = [
            { module: "Agriculture", count: totalPendingActions[0] + totalPendingActions[1] + totalPendingActions[2] },
            { module: "Cattle & Dairy", count: totalPendingActions[3] + totalPendingActions[4] + totalPendingActions[5] },
            { module: "Inventory", count: totalPendingActions[6] },
            { module: "HR", count: totalPendingActions[7] },
        ];

        // Response
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    agriculture: {
                        totalFarmers,
                        totalLands,
                        totalActiveCrops,
                    },
                    cattleDairy: {
                        totalCattle,
                        totalMilkVolume,
                        totalPendingProcessing,
                    },
                    inventory: {
                        totalItems: totalInventoryItems,
                        totalLowStock: totalLowStockItems,
                    },
                    hr: {
                        totalEmployees,
                        totalPayrollAmount,
                        totalOutstandingLoans,
                    },
                    finance: {
                        totalAssets: financialTotals.Assets + totalBankBalance,
                        totalLiabilities: financialTotals.Liabilities,
                        totalEquity: financialTotals.Equity,
                        netIncome: financialTotals.Income - financialTotals.Expense,
                    },
                },
                pendingActions: {
                    total: totalPendingActions,
                    totalPages: Math.ceil(totalPendingActions / limitNum),
                    currentPage: pageNum,
                    actions: pendingActionsList,
                    summary: pendingActionsSummary,
                },
                recentTransactions: {
                    total: recentTransactions.length,
                    transactions: recentTransactions,
                },
                revenueExpenseTrends,
                taskAnalytics: {
                    total: totalTaskAnalytics,
                    totalPages: Math.ceil(totalTaskAnalytics / limitNum),
                    currentPage: pageNum,
                    employees: taskAnalytics,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching dashboard data: ${error.message}` });
    }
};