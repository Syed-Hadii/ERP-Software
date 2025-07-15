const { default: mongoose } = require("mongoose");
const { Crop, Crop_Variety } = require("../../models/Agriculture/crop_variety");
const ChartAccount = require("../../models/Finance/chartAccountsModel");

// Helper to find or create a parent account
const findOrCreateParent = async (name, group, category, session) => {
    let parent = await ChartAccount.findOne({ name, group }).session(session);
    if (!parent) {
        parent = await ChartAccount.create(   
            [{ name, group, category, openingBalance: 0, currentBalance: 0 }],
            { session }
        );
        parent = parent[0];
    }
    return parent;
};

// Helper to find or create a child account
const findOrCreateChild = async (parentId, childName, group, category, session) => {
    let child = await ChartAccount.findOne({ name: childName, parentAccount: parentId }).session(session);
    if (!child) {
        child = await ChartAccount.create(
            [
                {
                    name: childName,
                    group,
                    category,
                    parentAccount: parentId,
                    openingBalance: 0,
                    currentBalance: 0,
                },
            ],
            { session }
        );
        child = child[0];
    }
    return child;
};

// Add a new Crop
const addCrop = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { name } = req.body;
    try {
        const existingCrop = await Crop.findOne({ name }).session(session);
        if (existingCrop) {
            throw new Error("Crop with this name already exists.");
        }

        const inventoryParent = await findOrCreateParent("Agriculture Inventory", "Assets", "Current Asset", session);
        const inventoryChildName = name;
        const inventoryChild = await findOrCreateChild(inventoryParent._id, inventoryChildName, "Assets", "Current Asset", session);
        const incomeParent = await findOrCreateParent("Sales Revenue", "Income", "Sales Revenue", session);
        const incomeChildName = name;
        const incomeChild = await findOrCreateChild(incomeParent._id, incomeChildName, "Income", "Sales Revenue", session);

        const newCrop = new Crop({
            name,
            inventoryAccount: inventoryChild._id,
            revenueAccount: incomeChild._id,
        });
        await newCrop.save({ session });
        await session.commitTransaction();
        res.json({ success: true, message: "Crop added successfully." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding Crop." });
    }
};

// Delete a Crop by ID
const deleteCrop = async (req, res) => {
    try {
        const rezult = await Crop.deleteOne({ _id: req.body.id })
        return res.json({ success: true, message: "Crop is deleted" });
    } catch (error) {
        console.error("Error Deleting User:", error);
        res.json({ success: false, message: "Server error", error });
    }
};
// Update a Haari by ID
const updateCrop = async (req, res) => {
    try {
        const cropId = req.body.id;
        const updatedData = req.body;
        const updatedCrop = await Crop.findByIdAndUpdate(cropId, updatedData, { new: true });
        return res.json({ success: true, message: "Crop is Updated" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.json({ success: false, message: "Server error", error });
    }
};
// Get all Crop records
const getCrop = async (req, res) => {
    try {
        const crop = await Crop.find({});
        return res.json({
            totalCrop: crop.length,
            crop,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// Get crop varieties by crop ID
const getCropVarietyByCrop = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching varieties for crop ID: ${id}`);
        const varietyList = await Crop_Variety.find({ crop: id }).select('_id variety crop');
        console.log(`Found ${varietyList.length} varieties`);
        return res.json({
            success: true,
            varietyList
        });
    } catch (error) {
        console.log("Error in getCropVarietyByCrop:", error);
        res.status(500).json({ success: false, message: "Error fetching crop varieties" });
    }
};


const addCropVariety = async (req, res) => {
    const { cropId, variety } = req.body;
    try {
        const newCropVariety = new Crop_Variety({
            crop: cropId,
            variety
        });
        await newCropVariety.save();
        res.json({ success: true, message: "Crop Variety added successfully." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error adding Crop Variety." });
    }
};

// Delete a Crop by ID
const deleteCropVariety = async (req, res) => {
    try {
        const rezult = await Crop_Variety.deleteOne({ _id: req.body.id })
        return res.json({ success: true, message: "Crop is deleted" });
    } catch (error) {
        console.error("Error Deleting User:", error);
        res.json({ success: false, message: "Server error", error });
    }
};
// Update a Haari by ID
const updateCropVariety = async (req, res) => {
    try {
        const cropVarietyId = req.body.id;
        const updatedData = req.body;
        const updatedCropVariety = await Crop.findByIdAndUpdate(cropVarietyId, updatedData, { new: true });
        return res.json({ success: true, message: "Crop Variety is Updated" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.json({ success: false, message: "Server error", error });
    }
};
// Get all Crop records
const getCropVariety = async (req, res) => {
    try {
        const crop = await Crop_Variety.find({});
        return res.json({
            totalCrop: crop.length,
            crop,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

module.exports = { addCrop, deleteCrop, updateCrop, getCrop, addCropVariety, deleteCropVariety, updateCropVariety, getCropVariety, getCropVarietyByCrop };
