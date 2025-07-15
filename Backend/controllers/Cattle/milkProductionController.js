const mongoose = require("mongoose");
const MilkProduction = require('../../models/Cattle/milkProduction');
const DairyInventory = require('../../models/Cattle/dairyInventory');
const DairyProduct = require('../../models/Cattle/dairyProduct');
const CattleRegister = require('../../models/Cattle/cattle-Register');
const FeedUsage = require('../../models/Cattle/feedUsage');
const HealthEvent = require('../../models/Cattle/healthEvent'); 
const ChartAccount = require("../../models/Finance/chartAccountsModel");

// Calculate COGS per litre for a cattle type over a period
const calculateMilkCOGS = async (cattleType, startDate, endDate, dairyProduct, session) => {
    // Get all cattle IDs for the type
    const cattleIds = await CattleRegister.find({ type: cattleType }).select('_id').session(session);
    
    // Sum feed costs
    const feedCosts = await FeedUsage.aggregate([
        {
            $match: {
                cattleId: { $in: cattleIds.map(id => id._id) },
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $lookup: {
                from: 'inventories',
                localField: 'productId',
                foreignField: 'item',
                as: 'inventory'
            }
        },
        {
            $unwind: { path: '$inventory', preserveNullAndEmptyArrays: true }
        },
        {
            $match: { 'inventory.owner': 'cattle' }
        },
        {
            $group: {
                _id: null,
                totalCost: { $sum: { $multiply: ['$quantityUsed', '$inventory.averageCost'] } }
            }
        }
    ]).session(session);

    // Sum medicine costs
    const medicineCosts = await HealthEvent.aggregate([
        {
            $match: {
                cattleId: { $in: cattleIds.map(id => id._id) },
                eventType: { $in: ['Vaccination', 'Treatment'] },
                status: 'Completed',
                updatedAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $lookup: {
                from: 'inventories',
                localField: 'medicineId',
                foreignField: 'item',
                as: 'inventory'
            }
        },
        {
            $unwind: { path: '$inventory', preserveNullAndEmptyArrays: true }
        },
        {
            $match: { 'inventory.owner': 'cattle' }
        },
        {
            $group: {
                _id: null,
                totalCost: { $sum: '$inventory.averageCost' } // Assuming 1 unit per event
            }
        }
    ]).session(session);

    // Sum milk volume
    const milkVolume = await MilkProduction.aggregate([
        {
            $match: {
                cattleId: { $in: cattleIds.map(id => id._id) },
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalVolume: { $sum: '$volume' }
            }
        }
    ]).session(session);

    const totalFeedCost = feedCosts[0]?.totalCost || 0;
    const totalMedicineCost = medicineCosts[0]?.totalCost || 0;
    const totalVolume = milkVolume[0]?.totalVolume || 0;
    const cogsPerLitre = totalVolume > 0 ? (totalFeedCost + totalMedicineCost) / totalVolume : dairyProduct.standardCost || 0;

    return cogsPerLitre;
};



// Create milk production record
exports.createMilkProduction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cattleId, volume, date, shift, employee, notes } = req.body;
        if (!cattleId || !volume || !date || !shift || !employee) {
            throw new Error("All required fields (cattleId, volume, date, shift, employee) must be provided");
        }
        const cattle = await CattleRegister.findById(cattleId).session(session);
        if (!cattle) {
            throw new Error("Cattle not found");
        }
        const employeeExists = await mongoose.model("Employee").findById(employee).session(session);
        if (!employeeExists) {
            throw new Error("Employee not found");
        }
        const animalType = cattle.type.charAt(0).toUpperCase() + cattle.type.slice(1);
        const productName = `${animalType} Raw Milk`;
        const dairyProduct = await DairyProduct.findOne({ name: productName }).session(session);
        if (!dairyProduct) {
            throw new Error(`${productName} not found in dairy products`);
        }
        // Calculate COGS for the cattle type (e.g., last 30 days)
        const endDate = new Date(date);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        const cogsPerLitre = await calculateMilkCOGS(animalType.toLowerCase(), startDate, endDate, dairyProduct, session);
        
        const newRecord = new MilkProduction({
            cattleId,
            volume: parseFloat(volume),
            date,
            shift,
            employee,
            notes,
        });
        await newRecord.save({ session });

        // Update DairyInventory
        const inventory = await DairyInventory.findOne({ productId: dairyProduct._id }).session(session);
        const newQuantity = (inventory ? inventory.quantity : 0) + parseFloat(volume);
        const newTotalCost = (inventory ? inventory.totalCost : 0) + (parseFloat(volume) * cogsPerLitre);
        await DairyInventory.findOneAndUpdate(
            { productId: dairyProduct._id },
            {
                $set: {
                    quantity: newQuantity,
                    averageCost: cogsPerLitre, // ACTUAL COGS
                    totalCost: newQuantity * cogsPerLitre, // ACTUAL COGS
                    lastUpdated: new Date(),
                },
            },
            { upsert: true, session }
        );

        // Update cattleInventoryAccount
        const inventoryCost = parseFloat(volume) * cogsPerLitre;
        const inventoryAccount = await ChartAccount.findById(dairyProduct.cattleInventoryAccount).session(session);
        if (!inventoryAccount) {
            throw new Error(`Cattle inventory account ${dairyProduct.cattleInventoryAccount} not found`);
        }
        inventoryAccount.currentBalance += inventoryCost;
        await inventoryAccount.save({ session });

       

        await newRecord.populate("cattleId", "cattleId breed");
        await session.commitTransaction();
        res.status(201).json({ success: true, data: newRecord });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: `Error creating milk production record: ${error.message}` });
    } finally {
        session.endSession();
    }
};

// Update milk production record
exports.updateMilkProduction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { volume, date, shift, employee, notes } = req.body;
        const oldRecord = await MilkProduction.findById(req.params.id).session(session);
        if (!oldRecord) {
            throw new Error("Milk production record not found");
        }
        const cattle = await CattleRegister.findById(oldRecord.cattleId).session(session);
        if (!cattle) {
            throw new Error("Cattle not found");
        }
        const animalType = cattle.type.charAt(0).toUpperCase() + cattle.type.slice(1);
        const productName = `${animalType} Raw Milk`;
        const dairyProduct = await DairyProduct.findOne({ name: productName }).session(session);
        if (!dairyProduct) {
            throw new Error(`${productName} not found in dairy products`);
        }
        // Calculate COGS for the cattle type
        const endDate = new Date(date || oldRecord.date);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        const cogsPerLitre = await calculateMilkCOGS(animalType.toLowerCase(), startDate, endDate, dairyProduct, session);

        const updatedRecord = await MilkProduction.findByIdAndUpdate(
            req.params.id,
            { volume: parseFloat(volume), date, shift, employee, notes },
            { new: true, runValidators: true }
        ).populate("cattleId", "cattleId breed").session(session);

        if (oldRecord.volume !== parseFloat(volume)) {
            const volumeDiff = parseFloat(volume) - oldRecord.volume;
            const inventory = await DairyInventory.findOne({ productId: dairyProduct._id }).session(session);
            const newQuantity = (inventory ? inventory.quantity : 0) + volumeDiff;
            const newTotalCost = (inventory ? inventory.totalCost : 0) + (volumeDiff * cogsPerLitre);
            await DairyInventory.findOneAndUpdate(
                { productId: dairyProduct._id },
                {
                    $set: {
                        quantity: newQuantity,
                        averageCost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
                        totalCost: newTotalCost,
                        lastUpdated: new Date(),
                    },
                },
                { upsert: true, session }
            );

            // Update cattleInventoryAccount
            const inventoryCostDiff = volumeDiff * cogsPerLitre;
            const inventoryAccount = await ChartAccount.findById(dairyProduct.cattleInventoryAccount).session(session);
            if (!inventoryAccount) {
                throw new Error(`Cattle inventory account ${dairyProduct.cattleInventoryAccount} not found`);
            }
            inventoryAccount.currentBalance += inventoryCostDiff;
            await inventoryAccount.save({ session });

            
        }

        await session.commitTransaction();
        res.json({ success: true, data: updatedRecord });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: `Error updating milk production record: ${error.message}` });
    } finally {
        session.endSession();
    }
};
// List milk production records
exports.listMilkProduction = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = '-date', animalType, shift, fromDate, toDate } = req.query;
        const query = {};
        if (animalType) {
            const cattleIds = await CattleRegister.find({ type: animalType }).select('_id');
            query.cattleId = { $in: cattleIds };
        }
        if (shift) query.shift = shift;
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            MilkProduction.find(query)
                .populate('cattleId', 'cattleId breed type')
                .sort(sortBy)
                .skip(skip)
                .limit(parseInt(limit)),
            MilkProduction.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: records,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching milk production records",
            error: error.message
        });
    }
};

// Get single milk production record
exports.getMilkProduction = async (req, res) => {
    try {
        const record = await MilkProduction.findById(req.params.id)
            .populate('cattleId', 'cattleId breed');
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Milk production record not found"
            });
        }
        res.json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching milk production record",
            error: error.message
        });
    }
};
// Delete milk production record
exports.deleteMilkProduction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const record = await MilkProduction.findById(req.params.id).session(session);
        if (!record) {
            throw new Error("Milk production record not found");
        }
        const cattle = await CattleRegister.findById(record.cattleId).session(session);
        if (!cattle) {
            throw new Error("Cattle not found");
        }
        const animalType = cattle.type.charAt(0).toUpperCase() + cattle.type.slice(1);
        const productName = `${animalType} Raw Milk`;
        const dairyProduct = await DairyProduct.findOne({ name: productName }).session(session);
        if (!dairyProduct) {
            throw new Error(`${productName} not found in dairy products`);
        }
        // Calculate COGS for the cattle type
        const endDate = new Date(record.date);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        const cogsPerLitre = await calculateMilkCOGS(animalType.toLowerCase(), startDate, endDate, dairyProduct, session);

        const inventory = await DairyInventory.findOne({ productId: dairyProduct._id }).session(session);
        const newQuantity = (inventory ? inventory.quantity : 0) - record.volume;
        const newTotalCost = (inventory ? inventory.totalCost : 0) - (record.volume * cogsPerLitre);
        await DairyInventory.findOneAndUpdate(
            { productId: dairyProduct._id },
            {
                $set: {
                    quantity: newQuantity,
                    averageCost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
                    totalCost: newTotalCost,
                    lastUpdated: new Date(),
                },
            },
            { upsert: true, session }
        );

        // Update cattleInventoryAccount
        const inventoryCost = -(record.volume * cogsPerLitre);
        const inventoryAccount = await ChartAccount.findById(dairyProduct.cattleInventoryAccount).session(session);
        if (!inventoryAccount) {
            throw new Error(`Cattle inventory account ${dairyProduct.cattleInventoryAccount} not found`);
        }
        inventoryAccount.currentBalance += inventoryCost;
        await inventoryAccount.save({ session });

       

        await record.deleteOne({ session });
        await session.commitTransaction();
        res.json({
            success: true,
            message: "Milk production record deleted successfully"
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: "Error deleting milk production record",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};