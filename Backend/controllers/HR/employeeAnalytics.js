const mongoose = require("mongoose");
const Employee = require("../../models/HR/employees");
const Attendance = require("../../models/HR/attendance");
const Payroll = require("../../models/HR/payroll");
const PayrollRequest = require("../../models/HR/payrollRequest");
const Loan = require("../../models/HR/loan");
const Increment = require("../../models/HR/increment");
const CropSchedule = require("../../models/Agriculture/crop_schedules");
const MilkProduction = require("../../models/Cattle/milkProduction");
const FeedProcess = require("../../models/Cattle/feed-process");
const FeedUsage = require("../../models/Cattle/feedUsage");
const DairyProcessing = require("../../models/Cattle/dairyProcessing");

exports.getHRDashboard = async (req, res) => {
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

        // 1. Employee Summary
        const [totalEmployees, employeesByDepartment, employeesByDesignation] = await Promise.all([
            Employee.countDocuments({ status: "active" }),
            Employee.aggregate([
                { $match: { status: "active" } },
                { $group: { _id: "$department", count: { $sum: 1 } } },
                { $project: { department: "$_id", count: 1, _id: 0 } },
            ]),
            Employee.aggregate([
                { $match: { status: "active" } },
                { $group: { _id: "$designation", count: { $sum: 1 } } },
                { $project: { designation: "$_id", count: 1, _id: 0 } },
            ]),
        ]);

        // 2. Attendance Summary (Last 30 Days)
        const attendanceSummary = await Attendance.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo, $lte: today } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // 3. Recent Attendance (Paginated)
        const recentAttendance = await Attendance.find({
            date: { $gte: thirtyDaysAgo, $lte: today },
        })
            .populate("employee", "firstName lastName department designation")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalRecentAttendance = await Attendance.countDocuments({
            date: { $gte: thirtyDaysAgo, $lte: today },
        });

        // 4. Payroll Summary (Last 30 Days)
        const payrollSummary = await Payroll.aggregate([
            {
                $match: {
                    $and: [
                        { $expr: { $eq: [{ $year: "$createdAt" }, { $year: new Date() }] } },
                        { $expr: { $eq: [{ $month: "$createdAt" }, { $month: new Date() }] } },
                    ],
                },
            },
            {
                $group: {
                    _id: "$financeStatus",
                    totalAmount: { $sum: "$netPay" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    status: "$_id",
                    totalAmount: 1,
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // 5. Pending Payroll Requests (Paginated)
        const pendingPayrollRequests = await PayrollRequest.find({ status: "Pending" })
            .populate({
                path: "payrolls",
                populate: { path: "employee", select: "firstName lastName" },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalPendingPayrollRequests = await PayrollRequest.countDocuments({ status: "Pending" });

        // 6. Loan Summary
        const [outstandingLoans, recentLoanPayments] = await Promise.all([
            Loan.aggregate([
                { $match: { isPaid: false, type: "Employee" } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        totalAmount: 1,
                        count: 1,
                        _id: 0,
                    },
                },
            ]),
            Loan.aggregate([
                {
                    $match: {
                        "paidHistory.date": { $gte: thirtyDaysAgo, $lte: today },
                        type: "Employee",
                    },
                },
                { $unwind: "$paidHistory" },
                {
                    $match: {
                        "paidHistory.date": { $gte: thirtyDaysAgo, $lte: today },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalPaid: { $sum: "$paidHistory.amount" },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        totalPaid: 1,
                        count: 1,
                        _id: 0,
                    },
                },
            ]),
        ]);

        // 7. Outstanding Loans (Paginated)
        const outstandingLoansList = await Loan.find({ isPaid: false, type: "Employee" })
            .populate("employee", "firstName lastName")
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalOutstandingLoans = await Loan.countDocuments({ isPaid: false, type: "Employee" });

        // 8. Increment Summary (Last 30 Days)
        const incrementSummary = await Increment.aggregate([
            {
                $match: {
                    date: { $gte: thirtyDaysAgo, $lte: today },
                    type: "Employee",
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    totalAmount: 1,
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // 9. Task Analytics (CropSchedule, MilkProduction, FeedProcess, FeedUsage, DairyProcessing)
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
                    designation: 1,
                    cropTasks: {
                        pending: { $arrayElemAt: ["$cropTasks", { $indexOfArray: ["$cropTasks._id", "Pending"] }] },
                        completed: { $arrayElemAt: ["$cropTasks", { $indexOfArray: ["$cropTasks._id", "Completed"] }] },
                        inProgress: { $arrayElemAt: ["$cropTasks", { $indexOfArray: ["$cropTasks._id", "InProgress"] }] },
                    },
                    milkTasks: { $arrayElemAt: ["$milkTasks.count", 0] },
                    feedProcessTasks: { $arrayElemAt: ["$feedProcessTasks.count", 0] },
                    feedUsageTasks: { $arrayElemAt: ["$feedUsageTasks.count", 0] },
                    dairyProcessingTasks: {
                        pending: { $arrayElemAt: ["$dairyProcessingTasks", { $indexOfArray: ["$dairyProcessingTasks._id", "pending"] }] },
                        completed: { $arrayElemAt: ["$dairyProcessingTasks", { $indexOfArray: ["$dairyProcessingTasks._id", "completed"] }] },
                    },
                },
            },
            {
                $project: {
                    employeeId: 1,
                    name: 1,
                    department: 1,
                    designation: 1,
                    tasks: {
                        pending: {
                            $sum: [
                                { $ifNull: ["$cropTasks.pending.count", 0] },
                                { $ifNull: ["$dairyProcessingTasks.pending.count", 0] },
                            ],
                        },
                        completed: {
                            $sum: [
                                { $ifNull: ["$cropTasks.completed.count", 0] },
                                { $ifNull: ["$dairyProcessingTasks.completed.count", 0] },
                            ],
                        },
                        inProgress: { $ifNull: ["$cropTasks.inProgress.count", 0] },
                        milkTasks: { $ifNull: ["$milkTasks", 0] },
                        feedProcessTasks: { $ifNull: ["$feedProcessTasks", 0] },
                        feedUsageTasks: { $ifNull: ["$feedUsageTasks", 0] },
                    },
                },
            },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limitNum },
        ]);

        const totalTaskAnalytics = await Employee.countDocuments({ status: "active" });

        // Response
        res.status(200).json({
            success: true,
            data: {
                employeeSummary: {
                    totalEmployees,
                    byDepartment: employeesByDepartment,
                    byDesignation: employeesByDesignation,
                },
                attendance: {
                    summary: attendanceSummary,
                    totalRecent: totalRecentAttendance,
                    totalPages: Math.ceil(totalRecentAttendance / limitNum),
                    currentPage: pageNum,
                    records: recentAttendance,
                },
                payroll: {
                    summary: payrollSummary,
                    pendingRequests: {
                        total: totalPendingPayrollRequests,
                        totalPages: Math.ceil(totalPendingPayrollRequests / limitNum),
                        currentPage: pageNum,
                        requests: pendingPayrollRequests,
                    },
                },
                loans: {
                    summary: {
                        outstanding: outstandingLoans[0] || { totalAmount: 0, count: 0 },
                        recentPayments: recentLoanPayments[0] || { totalPaid: 0, count: 0 },
                    },
                    outstandingList: {
                        total: totalOutstandingLoans,
                        totalPages: Math.ceil(totalOutstandingLoans / limitNum),
                        currentPage: pageNum,
                        loans: outstandingLoansList,
                    },
                },
                increments: {
                    summary: incrementSummary[0] || { totalAmount: 0, count: 0 },
                },
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
 