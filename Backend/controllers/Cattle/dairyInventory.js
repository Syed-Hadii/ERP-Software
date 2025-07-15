const mongoose = require("mongoose");
const DairyInventory = require('../../models/Cattle/dairyInventory');
const DairyProduct = require('../../models/Cattle/dairyProduct');

// Get all inventory items
exports.getAllInventory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortKey = req.query.sortKey || 'lastUpdated';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;

        const query = DairyInventory.find().populate('productId', 'name category unit');

        const total = await DairyInventory.countDocuments();

        const inventory = await query
            .sort({ [sortKey]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: inventory,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single inventory item by ID
exports.getInventoryById = async (req, res) => {
    try {
        const item = await DairyInventory.findById(req.params.id)
            .populate('productId', 'name category unit');
        if (!item) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create or update inventory (internal use)
exports.addOrUpdateInventory = async (productId, quantityChange, batchNumber = null, expiryDate = null, cost = 0) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const inventory = await DairyInventory.findOne({ productId }).session(session);
            const product = await DairyProduct.findById(productId).session(session);
            if (!product) {
                throw new Error("Dairy product not found");
            }
            const costChange = quantityChange * (cost || product.standardCost);
            if (inventory) {
                const newQuantity = inventory.quantity + quantityChange;
                const newTotalCost = inventory.totalCost + costChange;
                inventory.quantity = newQuantity;
                inventory.totalCost = newTotalCost;
                inventory.averageCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
                inventory.lastUpdated = new Date();
                await inventory.save({ session });
            } else {
                await new DairyInventory({
                    productId,
                    quantity: quantityChange,
                    reorderLevel: 10,
                    averageCost: cost || product.standardCost,
                    totalCost: costChange,
                    lastUpdated: new Date(),
                    batchNumber,
                    expiryDate
                }).save({ session });
            }
            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error("Error in addOrUpdateInventory:", error);
        return { success: false, error: error.message };
    }
};

// Manually update inventory quantity
exports.updateInventory = async (req, res) => {
    try {
        const { productId, quantity, reorderLevel, batchNumber, expiryDate, averageCost, totalCost } = req.body;
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const updated = await DairyInventory.findByIdAndUpdate(
                req.params.id,
                {
                    quantity,
                    reorderLevel,
                    batchNumber,
                    expiryDate,
                    averageCost,
                    totalCost,
                    lastUpdated: new Date()
                },
                { new: true, runValidators: true, session }
            ).populate('productId', 'name');
            if (!updated) {
                throw new Error("Inventory item not found");
            }
            await session.commitTransaction();
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: error.message });
        } finally {
            session.endSession();
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
    try {
        const deleted = await DairyInventory.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Inventory item not found" });
        }
        res.status(200).json({ success: true, message: "Inventory item deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
    try {
        const items = await DairyInventory.find({
            $expr: { $lte: ["$quantity", "$reorderLevel"] }
        }).populate('productId', 'name category');
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};