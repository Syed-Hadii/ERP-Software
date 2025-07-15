const {
    IrrigationSchedule,
    FertilizationSchedule,
    PesticideSchedule
} = require('../../models/Agriculture/crop_schedules');
const CropAssign = require('../../models/Agriculture/crop-sow');
const Inventory = require('../../models/Inventory/inventory');

// ========== IRRIGATION ==========
exports.createIrrigation = async (req, res) => {
    try {
        const { crop, date, method, quantity, employee, status, notes } = req.body;



        const irrigation = await IrrigationSchedule.create({
            crop,
            date,
            method,
            quantity,
            employee,
            status,
            notes
        });

        // Fetch the complete irrigation record with populated fields
        const populatedIrrigation = await IrrigationSchedule.findById(irrigation._id)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' },
                     
                ]
            });

        res.status(201).json(populatedIrrigation);
    } catch (err) {
        console.error("Error creating irrigation schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

exports.getIrrigations = async (req, res) => {
    try {
        const { crop } = req.query;
        let query = {};

        // If crop ID is provided, filter by it
        if (crop) {
            query.crop = crop;
        }

        const irrigations = await IrrigationSchedule.find(query)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' }, 
                ]
            })
            .sort({ date: -1 });

        res.json(irrigations);
    } catch (err) {
        console.error("Error retrieving irrigation schedules:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update irrigation status
exports.updateIrrigation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(req.body);

        // Find the irrigation record before updating
        const irrigationRecord = await IrrigationSchedule.findById(id);
        if (!irrigationRecord) {
            return res.status(404).json({ error: "Irrigation schedule not found" });
        }

        // Check if status is being updated to 'completed'
        if (status === 'completed' && irrigationRecord.status !== 'completed') {
            // For irrigation, we may need to find by method name
            // First, try to find an item with name matching the method

            const items = await require('../../models/Inventory/itemModel').find({
                name: irrigationRecord.method
            });

            if (items && items.length > 0) {
                // Find inventory for irrigation item
                const inventoryItem = await Inventory.findOne({
                    owner: 'agriculture',
                    item: items[0]._id
                });

                if (inventoryItem) {
                    // Subtract the scheduled quantity from inventory
                    if (inventoryItem.quantity >= irrigationRecord.quantity) {
                        await Inventory.findByIdAndUpdate(
                            inventoryItem._id,
                            { $inc: { quantity: -irrigationRecord.quantity } }
                        );
                        const irrigationCostPerUnit = 0.05; // Define your cost per unit
                        const irrigationCost = quantity * irrigationCostPerUnit;
                        await CropAssign.findByIdAndUpdate(irrigationRecord.crop._id, {
                            $inc: { incurredCosts: irrigationCost }
                        });
                    } else {
                        return res.status(400).json({
                            error: "Insufficient quantity in inventory",
                            available: inventoryItem.quantity,
                            required: irrigationRecord.quantity
                        });
                    }
                }
            }
        }

        // Update the irrigation record
        const updatedIrrigation = await IrrigationSchedule.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('employee', 'name').populate({
            path: 'crop',
            populate: [
                { path: 'crop', select: 'name' },
                { path: 'farmer', select: 'name' },
                { path: 'land', select: 'name' }, 
            ]
        });

        res.json(updatedIrrigation);
    } catch (err) {
        console.error("Error updating irrigation schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

// Delete irrigation schedule
exports.deleteIrrigation = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedIrrigation = await IrrigationSchedule.findByIdAndDelete(id);

        if (!deletedIrrigation) {
            return res.status(404).json({ error: "Irrigation schedule not found" });
        }

        res.json({ message: "Irrigation schedule deleted successfully" });
    } catch (err) {
        console.error("Error deleting irrigation schedule:", err);
        res.status(500).json({ error: err.message });
    }
};

// ========== FERTILIZATION ==========
exports.createFertilization = async (req, res) => {
    try {
        const { crop, date, fertilizer, quantity, employee, status, notes } = req.body;



        const fertilization = await FertilizationSchedule.create({
            crop,
            date,
            fertilizer,
            quantity,
            employee,
            status,
            notes
        });

        // Fetch the complete fertilization record with populated fields
        const populatedFertilization = await FertilizationSchedule.findById(fertilization._id)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' }, 
                ]
            })
            .populate('fertilizer');

        res.status(201).json(populatedFertilization);
    } catch (err) {
        console.error("Error creating fertilization schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

exports.getFertilizations = async (req, res) => {
    try {
        const { crop } = req.query;
        let query = {};

        // If crop ID is provided, filter by it
        if (crop) {
            query.crop = crop;
        }

        const fertilizations = await FertilizationSchedule.find(query)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' }, 
                ]
            })
            .populate('fertilizer')
            .sort({ date: -1 });

        res.json(fertilizations);
    } catch (err) {
        console.error("Error retrieving fertilization schedules:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update fertilization status
exports.updateFertilization = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Find the fertilization record before updating
        const fertilizationRecord = await FertilizationSchedule.findById(id).populate('fertilizer');
        if (!fertilizationRecord) {
            return res.status(404).json({ error: "Fertilization schedule not found" });
        }

        // Check if status is being updated to 'completed'
        if (status === 'completed' && fertilizationRecord.status !== 'completed') {
            // Find inventory for the fertilizer
            const inventoryItem = await Inventory.findOne({
                owner: 'agriculture',
                item: fertilizationRecord.fertilizer._id
            });

            if (inventoryItem) {
                // Subtract the scheduled quantity from inventory
                if (inventoryItem.quantity >= fertilizationRecord.quantity) {
                    await Inventory.findByIdAndUpdate(
                        inventoryItem._id,
                        { $inc: { quantity: -fertilizationRecord.quantity } }
                    );
                    const fertilizerCost = quantity * inventoryItem.averageCost;
                    await CropAssign.findByIdAndUpdate(fertilizationRecord.crop._id, {
                        $inc: { incurredCosts: fertilizerCost }
                    });
                } else {
                    return res.status(400).json({
                        error: "Insufficient quantity in inventory",
                        available: inventoryItem.quantity,
                        required: fertilizationRecord.quantity
                    });
                }
            }
        }

        // Find and update the fertilization record
        const updatedFertilization = await FertilizationSchedule.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('employee', 'name').populate({
            path: 'crop',
            populate: [
                { path: 'crop', select: 'name' },
                { path: 'farmer', select: 'name' },
                { path: 'land', select: 'name' }, 
            ]
        }).populate('fertilizer');

        res.json(updatedFertilization);
    } catch (err) {
        console.error("Error updating fertilization schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

// Delete fertilization schedule
exports.deleteFertilization = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFertilization = await FertilizationSchedule.findByIdAndDelete(id);

        if (!deletedFertilization) {
            return res.status(404).json({ error: "Fertilization schedule not found" });
        }

        res.json({ message: "Fertilization schedule deleted successfully" });
    } catch (err) {
        console.error("Error deleting fertilization schedule:", err);
        res.status(500).json({ error: err.message });
    }
};

// ========== PESTICIDE ==========
exports.createPesticide = async (req, res) => {
    try {
        const { crop, date, pesticide, quantity, employee, status, notes } = req.body;



        const pesticideSchedule = await PesticideSchedule.create({
            crop,
            date,
            pesticide,
            quantity,
            employee,
            status,
            notes
        });

        // Fetch the complete pesticide record with populated fields
        const populatedPesticide = await PesticideSchedule.findById(pesticideSchedule._id)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' }, 
                ]
            })
            .populate('pesticide');

        res.status(201).json(populatedPesticide);
    } catch (err) {
        console.error("Error creating pesticide schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

exports.getPesticides = async (req, res) => {
    try {
        const { crop } = req.query;
        let query = {};

        // If crop ID is provided, filter by it
        if (crop) {
            query.crop = crop;
        }

        const pesticides = await PesticideSchedule.find(query)
            .populate('employee', 'name')
            .populate({
                path: 'crop',
                populate: [
                    { path: 'crop', select: 'name' },
                    { path: 'farmer', select: 'name' },
                    { path: 'land', select: 'name' }, 
                ]
            })
            .populate('pesticide')
            .sort({ date: -1 });

        res.json(pesticides);
    } catch (err) {
        console.error("Error retrieving pesticide schedules:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update pesticide status
exports.updatePesticide = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Find the pesticide record before updating
        const pesticideRecord = await PesticideSchedule.findById(id).populate('pesticide');
        if (!pesticideRecord) {
            return res.status(404).json({ error: "Pesticide schedule not found" });
        }

        // Check if status is being updated to 'completed'
        if (status === 'completed' && pesticideRecord.status !== 'completed') {
            // Find inventory for the pesticide
            const inventoryItem = await Inventory.findOne({
                owner: 'agriculture',
                item: pesticideRecord.pesticide._id
            });

            if (inventoryItem) {
                // Subtract the scheduled quantity from inventory
                if (inventoryItem.quantity >= pesticideRecord.quantity) {
                    await Inventory.findByIdAndUpdate(
                        inventoryItem._id,
                        { $inc: { quantity: -pesticideRecord.quantity } }
                    );
                } else {
                    return res.status(400).json({
                        error: "Insufficient quantity in inventory",
                        available: inventoryItem.quantity,
                        required: pesticideRecord.quantity
                    });
                }
            }
        }

        // Find and update the pesticide record
        const updatedPesticide = await PesticideSchedule.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('employee', 'name').populate({
            path: 'crop',
            populate: [
                { path: 'crop', select: 'name' },
                { path: 'farmer', select: 'name' },
                { path: 'land', select: 'name' }, 
            ]
        }).populate('pesticide');

        res.json(updatedPesticide);
    } catch (err) {
        console.error("Error updating pesticide schedule:", err);
        res.status(400).json({ error: err.message });
    }
};

// Delete pesticide schedule
exports.deletePesticide = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPesticide = await PesticideSchedule.findByIdAndDelete(id);

        if (!deletedPesticide) {
            return res.status(404).json({ error: "Pesticide schedule not found" });
        }

        res.json({ message: "Pesticide schedule deleted successfully" });
    } catch (err) {
        console.error("Error deleting pesticide schedule:", err);
        res.status(500).json({ error: err.message });
    }
};
