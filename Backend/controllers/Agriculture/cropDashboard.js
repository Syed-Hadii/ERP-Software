const CropAssign = require('../../models/Agriculture/crop-sow');
const Land = require('../../models/Agriculture/landModel');
const Farmer = require('../../models/Agriculture/farmer');
const { IrrigationSchedule, FertilizationSchedule, PesticideSchedule } = require('../../models/Agriculture/crop_schedules');

// Get active crop count
exports.getActiveCrops = async (req, res) => {
    try {
        const count = await CropAssign.countDocuments({ cropStatus: 'Active' });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching active crops",
            error: error.message
        });
    }
};

// Get land utilization (assigned vs total land)
exports.getLandUtilization = async (req, res) => {
    try {
        const [totalLands, assignedLands] = await Promise.all([
            Land.countDocuments(),
            CropAssign.countDocuments({ cropStatus: { $ne: 'Harvested' } })
        ]);

        res.json({
            success: true,
            totalLands,
            assignedLands,
            utilizationRate: totalLands > 0 ? (assignedLands / totalLands * 100).toFixed(2) : 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching land utilization",
            error: error.message
        });
    }
};

// Get upcoming tasks (irrigation, fertilization, pesticide for next 7 days)
exports.getUpcomingTasks = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const [irrigations, fertilizations, pesticides] = await Promise.all([
            IrrigationSchedule.find({
                date: { $gte: today, $lte: nextWeek },
                status: 'pending'
            }).populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'land', select: 'name' }
                ]
            }),
            FertilizationSchedule.find({
                date: { $gte: today, $lte: nextWeek },
                status: 'pending'
            }).populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'land', select: 'name' }
                ]
            }).populate('fertilizer', 'name'),
            PesticideSchedule.find({
                date: { $gte: today, $lte: nextWeek },
                status: 'pending'
            }).populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'land', select: 'name' }
                ]
            }).populate('pesticide', 'name')
        ]);

        res.json({
            success: true,
            tasks: {
                irrigations,
                fertilizations,
                pesticides
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching upcoming tasks",
            error: error.message
        });
    }
};

// Get recent crop assignments (last 7 days)
exports.getRecentAssignments = async (req, res) => {
    try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const assignments = await CropAssign.find({
            createdAt: { $gte: lastWeek }
        })
            .populate('crop', 'name')
            .populate('variety', 'variety')
            .populate('farmer', 'name')
            .populate('land', 'name');

        res.json({ success: true, assignments });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching recent assignments",
            error: error.message
        });
    }
};

// Get crop status distribution
exports.getCropStatusDistribution = async (req, res) => {
    try {
        const distribution = await CropAssign.aggregate([
            {
                $group: {
                    _id: '$cropStatus',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1
                }
            },
            {
                $sort: { status: 1 }
            }
        ]);

        res.json({ success: true, distribution });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching crop status distribution",
            error: error.message
        });
    }
};

// Get upcoming harvests (next 30 days)
exports.getUpcomingHarvests = async (req, res) => {
    try {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setDate(nextMonth.getDate() + 30);

        const harvests = await CropAssign.find({
            expectedHarvestDate: { $gte: today, $lte: nextMonth },
            cropStatus: { $ne: 'Harvested' }
        })
            .populate('crop', 'name')
            .populate('variety', 'variety')
            .populate('land', 'name')
            .sort({ expectedHarvestDate: 1 });

        res.json({ success: true, harvests });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching upcoming harvests",
            error: error.message
        });
    }
};

// Get total lands and recent lands (last 7 days)
exports.getLandMetrics = async (req, res) => {
    try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const [totalLands, recentLands] = await Promise.all([
            Land.countDocuments(),
            Land.find({ createdAt: { $gte: lastWeek } })
        ]);

        res.json({
            success: true,
            totalLands,
            recentLands: recentLands.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching land metrics",
            error: error.message
        });
    }
};

// Get active farmers and recent farmers (last 7 days)
exports.getFarmerMetrics = async (req, res) => {
    try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const [totalFarmers, activeFarmers, recentFarmers] = await Promise.all([
            Farmer.countDocuments(),
            CropAssign.distinct('farmer', { cropStatus: { $ne: 'Harvested' } }),
            Farmer.find({ createdAt: { $gte: lastWeek } })
        ]);

        res.json({
            success: true,
            totalFarmers,
            activeFarmers: activeFarmers.length,
            recentFarmers: recentFarmers.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching farmer metrics",
            error: error.message
        });
    }
};