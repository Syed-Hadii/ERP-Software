const mongoose = require("mongoose");
const Farmer = require("../../models/Agriculture/farmer");
const Land = require("../../models/Agriculture/landModel");
const Crop = require("../../models/Agriculture/crop_variety").Crop;
const Crop_Variety = require("../../models/Agriculture/crop_variety").Crop_Variety;
const Crop_Sow = require("../../models/Agriculture/crop-sow");
const { IrrigationSchedule, FertilizationSchedule, PesticideSchedule } = require("../../models/Agriculture/crop_schedules");
const Inventory = require("../../models/Inventory/inventory");
const InventoryRequest = require("../../models/Inventory/inventoryRequest");

exports.getAgricultureDashboard = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ success: false, message: "Invalid page or limit" });
        }

        const skip = (pageNum - 1) * limitNum;

        // 1. Farmers and Lands Summary
        const [totalFarmers, totalLands, assignedLands] = await Promise.all([
            Farmer.countDocuments(),
            Land.countDocuments(),
            Crop_Sow.distinct("land", { cropStatus: { $ne: "Harvested" } }).then(lands => lands.length),
        ]);

        // 2. Crop Assignments Summary
        const cropAssignmentsSummary = await Crop_Sow.aggregate([
            {
                $group: {
                    _id: "$cropStatus",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                },
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    totalQuantity: 1,
                    _id: 0,
                },
            },
        ]);

        // 3. Active Crop Assignments (Paginated)
        const activeCropAssignments = await Crop_Sow.find({ cropStatus: { $in: ["Planned", "Active"] } })
            .populate("crop", "name")
            .populate("variety", "variety")
            .populate("farmer", "name")
            .populate("land", "name")
            .populate("seed", "name unit")
            .sort({ seedSowingDate: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalActiveAssignments = await Crop_Sow.countDocuments({ cropStatus: { $in: ["Planned", "Active"] } });

        // 4. Schedules Overview
        const schedulesOverview = await Promise.all([
            IrrigationSchedule.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]),
            FertilizationSchedule.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]),
            PesticideSchedule.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        // 5. Pending Schedules (Paginated)
        const pendingSchedules = await Promise.all([
            IrrigationSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [
                        { path: "crop", select: "name" },
                        { path: "farmer", select: "name" },
                        { path: "land", select: "name" },
                    ],
                })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum),
            FertilizationSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [
                        { path: "crop", select: "name" },
                        { path: "farmer", select: "name" },
                        { path: "land", select: "name" },
                    ],
                })
                .populate("fertilizer", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum),
            PesticideSchedule.find({ status: "pending" })
                .populate({
                    path: "crop",
                    populate: [
                        { path: "crop", select: "name" },
                        { path: "farmer", select: "name" },
                        { path: "land", select: "name" },
                    ],
                })
                .populate("pesticide", "name")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum),
        ]);

        const totalPendingSchedules = await Promise.all([
            IrrigationSchedule.countDocuments({ status: "pending" }),
            FertilizationSchedule.countDocuments({ status: "pending" }),
            PesticideSchedule.countDocuments({ status: "pending" }),
        ]);

        // 6. Pending Inventory Requests (for Crop Manager)
        const pendingRequests = await InventoryRequest.find({ status: "pending", requestorType: "Crop Manager" })
            .populate("item", "name unit")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingRequests = await InventoryRequest.countDocuments({ status: "pending", requestorType: "Crop Manager" });

        // 7. Low Stock Alerts (for agriculture inventory)
        const lowStockItems = await Inventory.aggregate([
            {
                $match: { owner: "agriculture" },
            },
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
                },
            },
            { $sort: { quantity: 1 } },
            { $skip: skip },
            { $limit: limitNum },
        ]);

        const totalLowStockItems = await Inventory.aggregate([
            {
                $match: { owner: "agriculture" },
            },
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

        // Response
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalFarmers,
                    totalLands,
                    assignedLands,
                },
                cropAssignments: {
                    summary: cropAssignmentsSummary,
                    totalActive: totalActiveAssignments,
                    totalPages: Math.ceil(totalActiveAssignments / limitNum),
                    currentPage: pageNum,
                    assignments: activeCropAssignments,
                },
                schedules: {
                    overview: {
                        irrigation: schedulesOverview[0] || [],
                        fertilization: schedulesOverview[1] || [],
                        pesticide: schedulesOverview[2] || [],
                    },
                    pending: {
                        irrigation: {
                            total: totalPendingSchedules[0],
                            totalPages: Math.ceil(totalPendingSchedules[0] / limitNum),
                            currentPage: pageNum,
                            schedules: pendingSchedules[0],
                        },
                        fertilization: {
                            total: totalPendingSchedules[1],
                            totalPages: Math.ceil(totalPendingSchedules[1] / limitNum),
                            currentPage: pageNum,
                            schedules: pendingSchedules[1],
                        },
                        pesticide: {
                            total: totalPendingSchedules[2],
                            totalPages: Math.ceil(totalPendingSchedules[2] / limitNum),
                            currentPage: pageNum,
                            schedules: pendingSchedules[2],
                        },
                    },
                },
                inventoryRequests: {
                    total: totalPendingRequests,
                    totalPages: Math.ceil(totalPendingRequests / limitNum),
                    currentPage: pageNum,
                    requests: pendingRequests,
                },
                lowStockAlerts: {
                    total: totalLowStockItems[0]?.total || 0,
                    totalPages: Math.ceil((totalLowStockItems[0]?.total || 0) / limitNum),
                    currentPage: pageNum,
                    items: lowStockItems,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching dashboard data: ${error.message}` });
    }
};
 