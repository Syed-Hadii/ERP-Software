const mongoose = require("mongoose");
const Item = require("../../models/Inventory/itemModel");
const ChartAccount = require("../../models/Finance/chartAccountsModel");
const Inventory = require("../../models/Inventory/inventory");

// Category value to label mapping
const categoryLabelMap = {
  fertilizer: "Fertilizer",
  pesticide: "Pesticide",
  seed: "Seed",
  equipment: "Equipment",
  medicine: "Medicine",
  cattle_feed: "Cattle Feed",
  tools: "Tools",
  packaging: "Packaging",
  fuel_lubricants: "Fuel & Lubricants",
  irrigation_supplies: "Irrigation Supplies",
};

// Helper to get discriminator model
const getModelByCategory = (category) => {
  const model = Item.discriminators && Item.discriminators[category];
  return model || Item;
};

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

// Create Item
exports.save = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { category, name, description, unit, lowStockThreshold, ...rest } = req.body;
    if (!category || !name) {
      throw new Error("Category and name are required.");
    }
    if (!categoryLabelMap[category]) {
      throw new Error("Invalid category.");
    }

    const existingItem = await Item.findOne({ name }).session(session);
    if (existingItem) {
      throw new Error("Item with this name already exists.");
    }

    // Use category label for account names
    const categoryLabel = categoryLabelMap[category];

    // Create expense account
    const expenseParent = await findOrCreateParent("Cost of Goods Sold", "Expense", "Direct Expense", session);
    const expenseChildName = categoryLabel;
    const expenseChild = await findOrCreateChild(expenseParent._id, expenseChildName, "Expense", "Direct Expense", session);

    // Create three inventory parent accounts and their sub-accounts
    const managerInventoryParent = await findOrCreateParent("Manager Inventory", "Assets", "Current Asset", session);
    const cropInventoryParent = await findOrCreateParent("Agriculture Inventory", "Assets", "Current Asset", session);
    const cattleInventoryParent = await findOrCreateParent("Cattle Inventory", "Assets", "Current Asset", session);

    const managerInventoryChild = await findOrCreateChild(managerInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);
    const cropInventoryChild = await findOrCreateChild(cropInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);
    const cattleInventoryChild = await findOrCreateChild(cattleInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);

    const Model = getModelByCategory(category);
    const newItem = new Model({
      name,
      description: description?.trim(),
      unit,
      lowStockThreshold: parseInt(lowStockThreshold) || 0,
      expenseAccount: expenseChild._id,
      managerInventoryAccount: managerInventoryChild._id,
      cropInventoryAccount: cropInventoryChild._id,
      cattleInventoryAccount: cattleInventoryChild._id,
      ...rest,
    });
    await newItem.save({ session });
    await session.commitTransaction();
    res.json({ success: true, message: "Item added successfully.", data: newItem });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.message.includes("required") || error.message.includes("exists") || error.message.includes("Invalid") ? 400 : 500).json({
      success: false,
      message: `Error adding item: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
};

// Update Item
exports.update = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id, category, name, description, unit, lowStockThreshold, ...rest } = req.body;
    if (!id || !category || !name) {
      throw new Error("ID, category, and name are required.");
    }
    if (!categoryLabelMap[category]) {
      throw new Error("Invalid category.");
    }

    const existingItem = await Item.findOne({ name, _id: { $ne: id } }).session(session);
    if (existingItem) {
      throw new Error("Item with this name already exists.");
    }

    let expenseAccount, managerInventoryAccount, cropInventoryAccount, cattleInventoryAccount;
    const item = await Item.findById(id).session(session);
    if (!item) {
      throw new Error("Item not found.");
    }

    // Use category label for account names
    const categoryLabel = categoryLabelMap[category];
    if (item.category !== category) {
      // Update expense account if category changes
      const expenseParent = await findOrCreateParent("Cost of Goods Sold", "Expense", "Direct Expense", session);
      const expenseChildName = categoryLabel;
      const expenseChild = await findOrCreateChild(expenseParent._id, expenseChildName, "Expense", "Direct Expense", session);
      expenseAccount = expenseChild._id;

      // Update inventory accounts if category changes
      const managerInventoryParent = await findOrCreateParent("Manager Inventory", "Assets", "Current Asset", session);
      const cropInventoryParent = await findOrCreateParent("Agriculture Inventory", "Assets", "Current Asset", session);
      const cattleInventoryParent = await findOrCreateParent("Cattle Inventory", "Assets", "Current Asset", session);

      const managerInventoryChild = await findOrCreateChild(managerInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);
      const cropInventoryChild = await findOrCreateChild(cropInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);
      const cattleInventoryChild = await findOrCreateChild(cattleInventoryParent._id, categoryLabel, "Assets", "Current Asset", session);

      managerInventoryAccount = managerInventoryChild._id;
      cropInventoryAccount = cropInventoryChild._id;
      cattleInventoryAccount = cattleInventoryChild._id;
    } else {
      // Retain existing accounts if category hasn't changed
      expenseAccount = item.expenseAccount;
      managerInventoryAccount = item.managerInventoryAccount;
      cropInventoryAccount = item.cropInventoryAccount;
      cattleInventoryAccount = item.cattleInventoryAccount;
    }

    const updatedData = {
      name,
      description: description?.trim(),
      unit,
      lowStockThreshold: parseInt(lowStockThreshold) || 0,
      expenseAccount,
      managerInventoryAccount,
      cropInventoryAccount,
      cattleInventoryAccount,
      ...rest,
    };
    const updatedItem = await Item.findByIdAndUpdate(id, updatedData, { new: true }).session(session);
    if (!updatedItem) {
      throw new Error("Item not found.");
    }
    await session.commitTransaction();
    res.json({ success: true, message: "Item updated successfully.", data: updatedItem });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.message.includes("required") || error.message.includes("exists") || error.message.includes("Invalid") || error.message.includes("not found") ? 400 : 500).json({
      success: false,
      message: `Error updating item: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
};

// Delete Item
exports.destroy = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const item = await Item.findById(id).session(session);
    const inventory = await Inventory.findOne({ item: id }).session(session);
    if (!item) {
      throw new Error("Item not found.");
    }
    if (inventory) {
      throw new Error("Cannot delete item that is currently in inventory.");
    }

    await Item.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
    res.json({ success: true, message: "Item deleted successfully." });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: `Error deleting item: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
};

// View Items
exports.view = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", all } = req.query;
    if (all === "true") {
      const query = search ? { name: { $regex: search, $options: "i" } } : {};
      const items = await Item.find(query).populate("expenseAccount managerInventoryAccount cropInventoryAccount cattleInventoryAccount");
      return res.json({ success: true, totalItems: items.length, items });
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ success: false, message: "Invalid page or limit" });
    }
    const skip = (pageNum - 1) * limitNum;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const [totalItems, items] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query)
        .populate("expenseAccount managerInventoryAccount cropInventoryAccount cattleInventoryAccount")
        .skip(skip)
        .limit(limitNum),
    ]);
    res.json({
      success: true,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: pageNum,
      items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Error fetching items: ${error.message}` });
  }
};