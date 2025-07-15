const AgroInventory = require("../../models/Agriculture/agroInventory");
const { Crop, Crop_Variety } = require("../../models/Agriculture/crop_variety");
const Crop_Sow = require("../../models/Agriculture/crop-sow");

// Add stock
const addStock = async (req, res) => {
    const { crop, variety, quantity, fairValuePerUnit } = req.body;

    try {
        if (!crop || !variety || quantity == null || fairValuePerUnit == null) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (quantity <= 0 || fairValuePerUnit < 0) {
            return res.status(400).json({ success: false, message: "Quantity must be positive and fair value non-negative." });
        }

        const cropDoc = await Crop.findById(crop).populate("inventoryAccount");
        if (!cropDoc || !cropDoc.inventoryAccount) {
            return res.status(400).json({ success: false, message: "Invalid crop or missing inventory account." });
        }

        const varietyDoc = await Crop_Variety.findById(variety);
        if (!varietyDoc || varietyDoc.crop.toString() !== crop) {
            return res.status(400).json({ success: false, message: "Variety does not belong to the crop." });
        }

        const existing = await AgroInventory.findOne({ crop, variety });
        const totalValue = quantity * fairValuePerUnit;

        if (existing) {
            const newQty = existing.quantity + quantity;
            const newCost = existing.totalCost + totalValue;
            existing.quantity = newQty;
            existing.averageCost = newCost / newQty;
            existing.totalCost = newCost;
            existing.lastUpdated = new Date();
            await existing.save();
        } else {
            const newRecord = new AgroInventory({
                crop,
                variety,
                quantity,
                averageCost: fairValuePerUnit,
                totalCost: totalValue,
                lastUpdated: new Date(),
            });
            await newRecord.save();
        }

        res.json({ success: true, message: "Stock added successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error adding stock." });
    }
};

// Remove stock
const removeStock = async (req, res) => {
    const { crop, variety, quantity, type = "write-off", unit, saleAmount } = req.body;

    try {
        if (!crop || !variety || quantity == null || !type) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        if (quantity <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be greater than zero." });
        }

        if (type === "sale" && (saleAmount == null || saleAmount < 0)) {
            return res.status(400).json({ success: false, message: "Sale amount is required for sales." });
        }

        const inventory = await AgroInventory.findOne({ crop, variety });
        if (!inventory || inventory.quantity < quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${inventory?.quantity || 0}` });
        }

        // Optional: check unit consistency with Crop_Sow
        const sow = await Crop_Sow.findOne({ variety });
        if (sow && sow.actualYieldUnit && sow.actualYieldUnit !== unit) {
            return res.status(400).json({ success: false, message: `Unit mismatch. Expected: ${sow.actualYieldUnit}` });
        }

        const cost = quantity * inventory.averageCost;
        inventory.quantity -= quantity;
        inventory.totalCost -= cost;
        inventory.lastUpdated = new Date();
        await inventory.save();

        res.json({ success: true, message: `Stock ${type} processed successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: `Error processing stock ${type}.` });
    }
};

// Get all or paginated
const getAgroInventory = async (req, res) => {
    const fetchAll = req.query.all === "true";

    try {
        const query = AgroInventory.find().populate("crop variety");
        if (fetchAll) {
            const records = await query;
            return res.json({ total: records.length, data: records });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await AgroInventory.countDocuments();
        const data = await query.skip(skip).limit(limit);

        res.json({
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching inventory." });
    }
};

// Get by ID
const getAgroInventoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const record = await AgroInventory.findById(id).populate("crop variety");
        if (!record) {
            return res.status(404).json({ success: false, message: "Inventory not found." });
        }
        res.json({ success: true, data: record });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching record." });
    }
};

// Update
const updateAgroInventory = async (req, res) => {
    const { id } = req.params;
    const { quantity, fairValuePerUnit } = req.body;

    try {
        const inventory = await AgroInventory.findById(id);
        if (!inventory) {
            return res.status(404).json({ success: false, message: "Inventory not found." });
        }

        if (quantity != null && quantity < 0) {
            return res.status(400).json({ success: false, message: "Quantity cannot be negative." });
        }

        if (quantity != null && fairValuePerUnit == null) {
            return res.status(400).json({ success: false, message: "Fair value required when updating quantity." });
        }

        if (quantity != null) {
            inventory.quantity = quantity;
            inventory.averageCost = fairValuePerUnit;
            inventory.totalCost = quantity * fairValuePerUnit;
        } else if (fairValuePerUnit != null) {
            inventory.averageCost = fairValuePerUnit;
            inventory.totalCost = inventory.quantity * fairValuePerUnit;
        }

        inventory.lastUpdated = new Date();
        await inventory.save();

        res.json({ success: true, message: "Inventory updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating inventory." });
    }
};

// Delete
const deleteAgroInventory = async (req, res) => {
    const { id } = req.params;

    try {
        const inventory = await AgroInventory.findByIdAndDelete(id);
        if (!inventory) {
            return res.status(404).json({ success: false, message: "Inventory record not found." });
        }

        res.json({ success: true, message: "Inventory deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting inventory." });
    }
};

module.exports = {
    addStock,
    removeStock,
    getAgroInventory,
    getAgroInventoryById,
    updateAgroInventory,
    deleteAgroInventory,
};
