const CattleRegister = require('../../models/Cattle/cattle-Register');

// List cattle with filters, pagination, and sorting
exports.listCattle = async (req, res) => {
    try {
        const { breed, healthStatus, ageGroup, page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
        const query = { status: 'active' };

        // Apply filters
        if (breed) query.breed = breed;
        if (healthStatus) query.healthStatus = healthStatus;

        // Age group filter
        if (ageGroup) {
            const [minYears, maxYears] = ageGroup.split('-').map(Number);
            const minDate = new Date();
            const maxDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - maxYears);
            maxDate.setFullYear(maxDate.getFullYear() - minYears);

            query.dob = {
                $gte: minDate,
                $lte: maxDate
            };
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const [cattle, total] = await Promise.all([
            CattleRegister.find(query)
                .sort(sortBy)
                .skip(skip)
                .limit(parseInt(limit)),
            CattleRegister.countDocuments(query)
        ]);

        const cattleWithAge = cattle.map(cattle => {
            const dob = new Date(cattle.dob);
            const today = new Date();

            let years = today.getFullYear() - dob.getFullYear();
            let months = today.getMonth() - dob.getMonth();
            const days = today.getDate() - dob.getDate();

            if (days < 0) months--;
            if (months < 0) {
                years--;
                months += 12;
            }

            // Format age as a string
            let ageString = '';
            if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
            if (months > 0) {
                if (ageString) ageString += ', ';
                ageString += `${months} month${months > 1 ? 's' : ''}`;
            }
            if (!ageString) ageString = 'Less than 1 month';

            return {
                ...cattle.toObject(),
                age: ageString
            };
        });

        res.json({
            success: true,
            cattle: cattleWithAge,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching cattle list",
            error: error.message
        });
    }
};

exports.listActiveCattle = async (req, res) => {
    try {
        // Find all cattle with active status
        const activeCattle = await CattleRegister.find({ status: 'active' });



        res.json({
            success: true,
            count: activeCattle.length,
            cattle: activeCattle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching active cattle",
            error: error.message
        });
    }
};
// Create new cattle record
exports.createCattle = async (req, res) => {
    try {
        const newCattle = new CattleRegister(req.body);
        await newCattle.save();

        res.status(201).json({
            success: true,
            data: newCattle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating cattle record",
            error: error.message
        });
    }
};

// Get single cattle record
exports.getCattle = async (req, res) => {
    try {
        const cattle = await CattleRegister.findById(req.params.id);
        if (!cattle) {
            return res.status(404).json({
                success: false,
                message: "Cattle not found"
            });
        }

        res.json({
            success: true,
            data: cattle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching cattle record",
            error: error.message
        });
    }
};

// Update cattle record
exports.updateCattle = async (req, res) => {
    try {
        const cattle = await CattleRegister.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!cattle) {
            return res.status(404).json({
                success: false,
                message: "Cattle not found"
            });
        }

        res.json({
            success: true,
            data: cattle
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating cattle record",
            error: error.message
        });
    }
};

// Delete cattle record
exports.deleteCattle = async (req, res) => {
    try {
        const cattle = await CattleRegister.findById(req.params.id);

        if (!cattle) {
            return res.status(404).json({
                success: false,
                message: "Cattle not found"
            });
        }

        // Soft delete by updating status
        cattle.status = 'inactive';
        await cattle.save();

        res.json({
            success: true,
            message: "Cattle record deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting cattle record",
            error: error.message
        });
    }
};

// Delete multiple cattle records (soft delete)
exports.deleteMultipleCattles = async (req, res) => {
    try {
        const { ids } = req.body;
        console.log("Request body:", req.body);
        console.log("IDs received:", ids);

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Field 'ids' is required and must be a non-empty array"
            });
        }

        // Perform soft delete by updating status
        const result = await CattleRegister.updateMany(
            { _id: { $in: ids } },
            { $set: { status: 'inactive' } }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} Cattle(s) marked as inactive`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Error in deleteMultipleCattles:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting cattle records",
            error: err.message,
            details: {
                stack: err.stack,
                ids: req.body.ids
            }
        });
    }
};