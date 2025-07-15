const ExitEvent = require('../../models/Cattle/exitEvent');
const CattleRegister = require('../../models/Cattle/cattle-Register');

// List exit events with pagination
exports.listExitEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = '-date' } = req.query;
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            ExitEvent.find()
                .populate('cattleId', 'cattleId type  breed')
                .sort(sortBy)
                .skip(skip)
                .limit(parseInt(limit)),
            ExitEvent.countDocuments()
        ]);

        res.json({
            success: true,
            events,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching exit events",
            error: error.message
        });
    }
};

// Create exit event
exports.createExitEvent = async (req, res) => {
    try {
        // Check if cattle exists and is active
        const cattle = await CattleRegister.findById(req.body.cattleId);
        if (!cattle) {
            return res.status(404).json({
                success: false,
                message: "Cattle not found"
            });
        }
        if (cattle.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Cattle is already inactive"
            });
        }

        const newEvent = new ExitEvent(req.body);
        await newEvent.save();

        // Populate cattle details for response
        await newEvent.populate('cattleId', 'breed', "type");

        res.status(201).json({
            success: true,
            data: newEvent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating exit event",
            error: error.message
        });
    }
};

// Get single exit event
exports.getExitEvent = async (req, res) => {
    try {
        const event = await ExitEvent.findById(req.params.id)
            .populate('cattleId', 'cattleId breed');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Exit event not found"
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching exit event",
            error: error.message
        });
    }
};

// Update exit event
exports.updateExitEvent = async (req, res) => {
    try {
        const event = await ExitEvent.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('cattleId', 'cattleId type breed');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Exit event not found"
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating exit event",
            error: error.message
        });
    }
};

// Delete exit event
exports.deleteExitEvent = async (req, res) => {
    try {
        const event = await ExitEvent.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Exit event not found"
            });
        }

        // Reactivate the cattle
        await CattleRegister.findByIdAndUpdate(event.cattleId, { status: 'active' });

        // Delete the event
        await ExitEvent.deleteOne({ _id: event._id });

        res.json({
            success: true,
            message: "Exit event deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting exit event",
            error: error.message
        });
    }
};
exports.deleteMultipleExitEvent = async (req, res) => {
    try {
        const { ids } = req.body;
        console.log("Received IDs for deletion:", ids);

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Field 'ids' is required and must be a non-empty array"
            });
        }

        // Find all exit events first
        const events = await ExitEvent.find({ _id: { $in: ids } });
        console.log(`Found ${events.length} events to delete`);

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No events found with the provided IDs"
            });
        }

        // Reactivate all associated cattle
        for (const event of events) {
            console.log(`Reactivating cattle with ID: ${event.cattleId}`);
            await CattleRegister.findByIdAndUpdate(event.cattleId, { status: 'active' });
        }

        // Delete the events
        const result = await ExitEvent.deleteMany({ _id: { $in: ids } });
        console.log(`Deleted ${result.deletedCount} events`);

        res.json({
            success: true,
            message: `${result.deletedCount} ExitEvent(s) deleted successfully and cattle reactivated`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Error in deleteMultipleExitEvent:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting exit events",
            error: err.message,
            details: err.stack
        });
    }
};
// Get available active cattle based on type and breed
exports.getAvailableCattle = async (req, res) => {
    try {
        const { type, breed } = req.query;

        // Build query object
        const query = {
            status: 'active'  // Only get active cattle
        };

        if (type) query.type = type;
        if (breed) query.breed = breed;

        const cattle = await CattleRegister.find(query)
            .select('_id cattleId type breed')
            .sort('cattleId');

        res.json({
            success: true,
            data: cattle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching available cattle",
            error: error.message
        });
    }
};