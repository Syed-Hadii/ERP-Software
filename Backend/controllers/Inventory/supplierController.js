const mongoose = require("mongoose");
const Supplier = require("../../models/Inventory/supplierModel");
const ChartAccount = require("../../models/Finance/chartAccountsModel"); 

const save = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, contact, email, address, openingBalance } = req.body;

    if (!name || openingBalance === undefined) {
      throw new Error("Name and opening balance are required");
    }

    // Find or create Accounts Payable parent
    let apParent = await ChartAccount.findOne({
      name: "Accounts Payable",
      parentAccount: null,
    }).session(session);

    if (!apParent) {
      apParent = new ChartAccount({
        name: "Accounts Payable",
        code: "AP",
        group: "Liabilities",
        category: "Current Liability",
        openingBalance: 0,
        currentBalance: 0,
      });
      await apParent.save({ session });
    }

    // Generate supplier code
    const latestSupplier = await ChartAccount.findOne({
      code: /^SUP\d+$/,
    }).sort({ code: -1 }).session(session);

    let newCode = "SUP001";
    if (latestSupplier) {
      const lastNumber = parseInt(latestSupplier.code.slice(3));
      newCode = `SUP${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // Create supplier child account
    const childAccount = new ChartAccount({
      name,
      code: newCode,
      group: "Liabilities",
      category: "Current Liability",
      parentAccount: apParent._id,
      openingBalance,
      currentBalance: openingBalance,
    });
    await childAccount.save({ session });

    // Create supplier
    const supplier = new Supplier({
      name,
      contact,
      email,
      address,
      openingBalance,
      currentBalance: openingBalance,
      coaId: childAccount._id,
    });
    await supplier.save({ session });

    // Opening balance journal entry
    if (openingBalance > 0) {
      const openingEquity = await ChartAccount.findOne({
        name: "Opening Balance Equity",
      }).session(session);
      if (!openingEquity) throw new Error("Opening Balance Equity account not found");


      // Update parent account balance
      apParent.currentBalance += openingBalance;
      await apParent.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Supplier created", data: supplier });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: `Error creating supplier: ${error.message}` });
  } finally {
    session.endSession();
  }
};

const view = async (req, res) => {
  try {
    const fetchAll = req.query.all === "true";
    if (fetchAll) {
      const suppliers = await Supplier.find({}).populate("coaId", "name code openingBalance currentBalance");
      return res.status(200).json({
        success: true,
        totalSuppliers: suppliers.length,
        data: suppliers,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;

    const totalSuppliers = await Supplier.countDocuments();
    const suppliers = await Supplier.find({})
      .populate("coaId", "name code openingBalance currentBalance")
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / limit),
      currentPage: page,
      data: suppliers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Error fetching suppliers: ${error.message}` });
  }
};

const update = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { name, contact, email, address, openingBalance } = req.body;

    if (!id || !name || openingBalance === undefined) {
      throw new Error("ID, name, and opening balance are required");
    }

    const supplier = await Supplier.findById(id).session(session);
    if (!supplier) throw new Error("Supplier not found");

    const childAccount = await ChartAccount.findById(supplier.coaId).session(session);
    if (!childAccount) throw new Error("Associated chart account not found");

    const apParent = await ChartAccount.findById(childAccount.parentAccount).session(session);
    if (!apParent) throw new Error("Parent account not found");

    // Adjust parent balance for old opening balance
    apParent.currentBalance -= supplier.openingBalance;
    await apParent.save({ session });

    // Update supplier
    supplier.name = name;
    supplier.contact = contact || "";
    supplier.email = email || "";
    supplier.address = address || "";
    supplier.openingBalance = openingBalance;
    await supplier.save({ session });

    // Update chart account
    childAccount.name = name;
    childAccount.openingBalance = openingBalance;
    childAccount.currentBalance = childAccount.currentBalance - supplier.openingBalance + openingBalance;
    await childAccount.save({ session });

    // Update parent balance for new opening balance
    apParent.currentBalance += openingBalance;
    await apParent.save({ session });


    if (openingBalance > 0) {
      const openingEquity = await ChartAccount.findOne({ name: "Opening Balance Equity" }).session(session);
      if (!openingEquity) throw new Error("Opening Balance Equity account not found");


    }

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Supplier updated", data: supplier });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: `Error updating supplier: ${error.message}` });
  } finally {
    session.endSession();
  }
};

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id).session(session);
    if (!supplier) throw new Error("Supplier not found");

    const childAccount = await ChartAccount.findById(supplier.coaId).session(session);
    if (!childAccount) throw new Error("Associated chart account not found");

    const apParent = await ChartAccount.findById(childAccount.parentAccount).session(session);
    if (!apParent) throw new Error("Parent account not found");

    // Adjust parent balance
    apParent.currentBalance -= supplier.openingBalance;
    await apParent.save({ session });

    await ChartAccount.findByIdAndDelete(supplier.coaId).session(session);
    await Supplier.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Supplier deleted" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: `Error deleting supplier: ${error.message}` });
  } finally {
    session.endSession();
  }
};

module.exports = { save, view, update, remove };