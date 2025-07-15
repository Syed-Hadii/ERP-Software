const mongoose = require('mongoose');
const HealthEvent = require('../../models/Cattle/healthEvent');
const Inventory = require('../../models/Inventory/inventory');
const Item = require('../../models/Inventory/itemModel');
const ChartAccount = require('../../models/Finance/chartAccountsModel'); 


// Create health event
exports.createHealthEvent = async (req, res) => {
    try {
        const newEvent = new HealthEvent(req.body);
        const savedEvent = await newEvent.save();

        // Proper way to populate after creation
        const populatedEvent = await HealthEvent.findById(savedEvent._id)
            .populate('cattleId', 'cattleId type breed')
            .populate('medicineId', 'name unit')
            .populate('vetTechnician', 'firstName lastName'); // Changed from 'name' to match your schema

        res.status(201).json({
            success: true,
            data: populatedEvent
        });
    } catch (error) {
        console.error("Error creating health event:", error);
        res.status(400).json({
            success: false,
            message: "Error creating health event",
            error: error.message
        });
    }
};

// Update health event
exports.updateHealthEvent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status, medicineId, dosage, ...otherFields } = req.body;

        const existingEvent = await HealthEvent.findById(id).session(session);
        if (!existingEvent) {
            throw new Error("Health event not found");
        }

        // If status is changing to Completed and it's a Vaccination or Treatment
        if (status === 'Completed' && ['Vaccination', 'Treatment'].includes(existingEvent.eventType)) {
            if (!medicineId || !dosage) {
                throw new Error("Medicine ID and dosage are required for Vaccination or Treatment");
            }

            // Validate inventory
            const inv = await Inventory.findOne({ item: medicineId, owner: 'cattle' }).session(session);
            if (!inv || inv.quantity < 1) {
                throw new Error('Insufficient stock for medicine');
            }

            // Get item for cattleInventoryAccount
            const item = await Item.findById(medicineId).session(session);
            if (!item || !item.cattleInventoryAccount) {
                throw new Error('Item or cattle inventory account not found');
            }

            // Calculate cost (assuming 1 unit per dosage for simplicity; adjust if dosage is numeric)
            const medicineCost = inv.averageCost;

            // Deduct from inventory
            inv.quantity -= 1;
            inv.totalCost -= medicineCost;
            await inv.save({ session });

            // Update COA
            const cogsAccount = await ChartAccount.findOne({ name: 'Cost of Goods Sold', group: 'Expense' }).session(session);
            const cattleInventoryAccount = await ChartAccount.findById(item.cattleInventoryAccount).session(session);
            if (!cogsAccount || !cattleInventoryAccount) {
                throw new Error('Cost of Goods Sold or cattle inventory account not found');
            }

            cogsAccount.currentBalance += medicineCost;
            cattleInventoryAccount.currentBalance -= medicineCost;
            await Promise.all([
                cogsAccount.save({ session }),
                cattleInventoryAccount.save({ session })
            ]);

           
        }

        const event = await HealthEvent.findByIdAndUpdate(
            id,
            { status, medicineId, dosage, ...otherFields },
            { new: true, runValidators: true }
        ).populate('cattleId', 'cattleId type breed').populate('medicineId', 'name unit').populate('vetTechnician', 'name').session(session);

        if (!event) {
            throw new Error("Health event not found");
        }

        await session.commitTransaction();
        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(error.message.includes('not found') || error.message.includes('Insufficient') || error.message.includes('required') ? 400 : 500).json({
            success: false,
            message: "Error updating health event",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};
// List health events with filters and pagination
exports.listHealthEvents = async (req, res) => {
    try {
        const { cattleId, eventType, page = 1, limit = 10, sortBy = '-eventDate' } = req.query;
        const query = {};

        if (cattleId) query.cattleId = cattleId;
        if (eventType) query.eventType = eventType;

        const skip = (page - 1) * limit;
        const [events, total] = await Promise.all([
            HealthEvent.find(query)
                .populate('cattleId', 'cattleId breed type')
                .populate('medicineId', 'name unit')
                .populate('vetTechnician', 'name')
                .sort(sortBy)
                .skip(skip)
                .limit(parseInt(limit)),
            HealthEvent.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: events,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching health events",
            error: error.message
        });
    }
};


// Get single health event
exports.getHealthEvent = async (req, res) => {
    try {
        const event = await HealthEvent.findById(req.params.id)
            .populate('cattleId', 'cattleId type breed')
            .populate('medicineId', 'name unit')
            .populate('vetTechnician', 'name');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Health event not found"
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching health event",
            error: error.message
        });
    }
};
// Delete health event
exports.deleteHealthEvent = async (req, res) => {
    try {
        const event = await HealthEvent.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Health event not found"
            });
        }

        res.json({
            success: true,
            message: "Health event deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting health event",
            error: error.message
        });
    }
};

// Get upcoming health events
exports.getUpcomingEvents = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const events = await HealthEvent.find({
            nextDueDate: {
                $gte: today,
                $lte: nextWeek
            }
        }).populate('cattleId', 'cattleId type breed').populate('medicineId', 'name unit').populate('vetTechnician', 'name');


        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching upcoming events",
            error: error.message
        });
    }
};