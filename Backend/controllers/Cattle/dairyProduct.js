const mongoose = require("mongoose");
const DairyProduct = require("../../models/Cattle/dairyProduct");
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

// Create a new dairy product
exports.createDairyProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, unit, category, description, standardCost } = req.body;
        if (!name || !unit || !category) {
            throw new Error("Name, unit, and category are required.");
        }
        const existingProduct = await DairyProduct.findOne({ name }).session(session);
        if (existingProduct) {
            throw new Error("Product with this name already exists.");
        }
        const inventoryParent = await findOrCreateParent("Cattle Inventory", "Assets", "Current Asset", session);
        const inventoryChildName = category;
        const inventoryChild = await findOrCreateChild(inventoryParent._id, inventoryChildName, "Assets", "Current Asset", session);
        const incomeParent = await findOrCreateParent("Sales Revenue", "Income", "Sales Revenue", session);
        const incomeChildName = category;
        const incomeChild = await findOrCreateChild(incomeParent._id, incomeChildName, "Income", "Sales Revenue", session);
        const newDairyProduct = new DairyProduct({
            name,
            unit,
            category,
            description,
            standardCost: parseFloat(standardCost) || 0,
            cattleInventoryAccount: inventoryChild._id,
            incomeAccount: incomeChild._id,
        });
        await newDairyProduct.save({ session });
        await session.commitTransaction();
        res.status(201).json({ success: true, data: newDairyProduct });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Get all dairy products
exports.getAllDairyProducts = async (req, res) => {
    try {
        const dairyProducts = await DairyProduct.find().populate("cattleInventoryAccount incomeAccount");
        res.status(200).json({ success: true, data: dairyProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single dairy product by ID
exports.getDairyProductById = async (req, res) => {
    try {
        const dairyProduct = await DairyProduct.findById(req.params.id).populate("cattleInventoryAccount incomeAccount");
        if (!dairyProduct) {
            return res.status(404).json({ success: false, message: "Dairy product not found" });
        }
        res.status(200).json({ success: true, data: dairyProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a dairy product
exports.updateDairyProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id, name, unit, category, description, standardCost } = req.body;
        if (!id || !name || !unit || !category) {
            throw new Error("ID, name, unit, and category are required.");
        }
        const existingProduct = await DairyProduct.findOne({ name, _id: { $ne: id } }).session(session);
        if (existingProduct) {
            throw new Error("Product with this name already exists.");
        }
        const updatedData = {
            name,
            unit,
            category,
            description,
            standardCost: parseFloat(standardCost) || 0,
        };
        const updatedDairyProduct = await DairyProduct.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true }).session(session);
        if (!updatedDairyProduct) {
            throw new Error("Dairy product not found");
        }
        await session.commitTransaction();
        res.status(200).json({ success: true, data: updatedDairyProduct });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Soft delete a dairy product
exports.deleteDairyProduct = async (req, res) => {
    try {
        const dairyProduct = await DairyProduct.findByIdAndDelete(req.params.id);
        if (!dairyProduct) {
            return res.status(404).json({ success: false, message: "Dairy product not found" });
        }
        res.status(200).json({ success: true, message: "Dairy product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get dairy products by category
exports.getDairyProductsByCategory = async (req, res) => {
    try {
        const dairyProducts = await DairyProduct.find({
            category: req.params.category,
        }).populate("cattleInventoryAccount incomeAccount");
        res.status(200).json({ success: true, data: dairyProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};