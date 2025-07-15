const mongoose = require("mongoose");
const CattleRegister = require("../../models/Cattle/cattle-Register");
const MilkProduction = require("../../models/Cattle/milkProduction");
const DairyProcessing = require("../../models/Cattle/dairyProcessing");
const DairyInventory = require("../../models/Cattle/dairyInventory");
const HealthEvent = require("../../models/Cattle/healthEvent");
const DairySales = require("../../models/Cattle/dairySales");
const Inventory = require("../../models/Inventory/inventory");
const InventoryRequest = require("../../models/Inventory/inventoryRequest");

exports.getCattleDairyDashboard = async (req, res) => {
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

        // 1. Cattle Summary
        const [totalCattle, cattleByType, cattleByHealth] = await Promise.all([
            CattleRegister.countDocuments({ status: "active" }),
            CattleRegister.aggregate([
                { $match: { status: "active" } },
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $project: { type: "$_id", count: 1, _id: 0 } },
            ]),
            CattleRegister.aggregate([
                { $match: { status: "active" } },
                { $group: { _id: "$healthStatus", count: { $sum: 1 } } },
                { $project: { healthStatus: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        // 2. Milk Production Summary (Last 30 Days)
        const milkProductionSummary = await MilkProduction.aggregate([
            {
                $match: { date: { $gte: thirtyDaysAgo, $lte: today } },
            },
            {
                $lookup: {
                    from: "cattleregisters",
                    localField: "cattleId",
                    foreignField: "_id",
                    as: "cattle",
                },
            },
            { $unwind: "$cattle" },
            {
                $group: {
                    _id: "$cattle.type",
                    totalVolume: { $sum: "$volume" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    type: "$_id",
                    totalVolume: 1,
                    averageVolume: { $divide: ["$totalVolume", "$count"] },
                    _id: 0,
                },
            },
        ]);

        // 3. Recent Milk Production (Paginated)
        const recentMilkProduction = await MilkProduction.find({
            date: { $gte: thirtyDaysAgo, $lte: today },
        })
            .populate("cattleId", "cattleId type breed")
            .populate("employee", "name")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalMilkProduction = await MilkProduction.countDocuments({
            date: { $gte: thirtyDaysAgo, $lte: today },
        });

        // 4. Dairy Processing Overview
        const processingOverview = await DairyProcessing.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]);

        // 5. Pending Dairy Processing (Paginated)
        const pendingProcessing = await DairyProcessing.find({ status: "pending" })
            .populate("rawMilkProductId", "name")
            .populate("outputProducts.productId", "name")
            .populate("employee", "name")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingProcessing = await DairyProcessing.countDocuments({ status: "pending" });

        // 6. Health Events Overview
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const healthEventsOverview = await Promise.all([
            HealthEvent.countDocuments({ status: "Pending", nextDueDate: { $gte: today, $lte: nextWeek } }),
            HealthEvent.countDocuments({ status: "Completed" }),
        ]);

        // 7. Upcoming Health Events (Paginated)
        const upcomingHealthEvents = await HealthEvent.find({
            status: "Pending",
            nextDueDate: { $gte: today, $lte: nextWeek },
        })
            .populate("cattleId", "cattleId type breed")
            .populate("medicineId", "name unit")
            .populate("vetTechnician", "name")
            .sort({ nextDueDate: 1 })
            .skip(skip)
            .limit(limitNum);

        const totalUpcomingHealthEvents = await HealthEvent.countDocuments({
            status: "Pending",
            nextDueDate: { $gte: today, $lte: nextWeek },
        });

        // 8. Dairy Sales Summary (Last 30 Days)
        const salesSummary = await DairySales.aggregate([
            {
                $match: { date: { $gte: thirtyDaysAgo, $lte: today }, isDeleted: false },
            },
            {
                $group: {
                    _id: "$status",
                    totalSales: { $sum: "$totalPrice" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    status: "$_id",
                    totalSales: 1,
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // 9. Pending Dairy Sales (Paginated)
        const pendingSales = await DairySales.find({ status: "pending", isDeleted: false })
            .populate("customer", "name")
            .populate("items.item", "name unit")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingSales = await DairySales.countDocuments({ status: "pending", isDeleted: false });

        // 10. Pending Inventory Requests (for Cattle Manager)
        const pendingRequests = await InventoryRequest.find({ status: "pending", requestorType: "Cattle Manager" })
            .populate("item", "name unit")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingRequests = await InventoryRequest.countDocuments({
            status: "pending",
            requestorType: "Cattle Manager",
        });

        // 11. Low Stock Alerts (DairyInventory and cattle-owned Inventory)
        const lowStockItems = await Promise.all([
            DairyInventory.aggregate([
                {
                    $match: { $expr: { $lte: ["$quantity", "$reorderLevel"] }, quantity: { $gt: 0 } },
                },
                {
                    $lookup: {
                        from: "dairyproducts",
                        localField: "productId",
                        foreignField: "_id",
                        as: "productDetails",
                    },
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        itemName: "$productDetails.name",
                        unit: "$productDetails.unit",
                        quantity: 1,
                        reorderLevel: 1,
                    },
                },
                { $sort: { quantity: 1 } },
                { $skip: skip },
                { $limit: limitNum },
            ]),
            Inventory.aggregate([
                { $match: { owner: "cattle" } },
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
                        reorderLevel: "$itemDetails.lowStockThreshold",
                    },
                },
                { $sort: { quantity: 1 } },
                { $skip: skip },
                { $limit: limitNum },
            ]),
        ]);

        const totalLowStockItems = await Promise.all([
            DairyInventory.countDocuments({ $expr: { $lte: ["$quantity", "$reorderLevel"] }, quantity: { $gt: 0 } }),
            Inventory.aggregate([
                { $match: { owner: "cattle" } },
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
            ]),
        ]);

        // Response
        res.status(200).json({
            success: true,
            data: {
                cattleSummary: {
                    totalCattle,
                    byType: cattleByType,
                    byHealth: cattleByHealth,
                },
                milkProduction: {
                    summary: milkProductionSummary,
                    totalRecent: totalMilkProduction,
                    totalPages: Math.ceil(totalMilkProduction / limitNum),
                    currentPage: pageNum,
                    records: recentMilkProduction,
                },
                dairyProcessing: {
                    overview: processingOverview,
                    pending: {
                        total: totalPendingProcessing,
                        totalPages: Math.ceil(totalPendingProcessing / limitNum),
                        currentPage: pageNum,
                        records: pendingProcessing,
                    },
                },
                healthEvents: {
                    overview: {
                        upcoming: healthEventsOverview[0],
                        completed: healthEventsOverview[1],
                    },
                    upcoming: {
                        total: totalUpcomingHealthEvents,
                        totalPages: Math.ceil(totalUpcomingHealthEvents / limitNum),
                        currentPage: pageNum,
                        events: upcomingHealthEvents,
                    },
                },
                dairySales: {
                    summary: salesSummary,
                    pending: {
                        total: totalPendingSales,
                        totalPages: Math.ceil(totalPendingSales / limitNum),
                        currentPage: pageNum,
                        sales: pendingSales,
                    },
                },
                inventoryRequests: {
                    total: totalPendingRequests,
                    totalPages: Math.ceil(totalPendingRequests / limitNum),
                    currentPage: pageNum,
                    requests: pendingRequests,
                },
                lowStockAlerts: {
                    total: (totalLowStockItems[0] || 0) + (totalLowStockItems[1][0]?.total || 0),
                    totalPages: Math.ceil(((totalLowStockItems[0] || 0) + (totalLowStockItems[1][0]?.total || 0)) / limitNum),
                    currentPage: pageNum,
                    items: [...lowStockItems[0], ...lowStockItems[1]],
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching dashboard data: ${error.message}` });
    }
}; 