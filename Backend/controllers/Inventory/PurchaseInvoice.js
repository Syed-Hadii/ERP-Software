const mongoose = require("mongoose");
const PurchaseInvoice = require("../../models/Inventory/PurchaseInvoice");
const Item = require("../../models/Inventory/itemModel");
const Supplier = require("../../models/Inventory/supplierModel");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const Counter = require("../../models/Finance/counter.js");
const sanitize = require("mongo-sanitize");

// Generate invoice number with debugging
const generateInvoiceNumber = async (prefix, session) => {
  console.log(`[${new Date().toISOString()}] generateInvoiceNumber: Generating invoice number with prefix=${prefix}`);
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const counter = await Counter.findOneAndUpdate(
      { name: `${prefix}-sequence` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );
    console.log(`[${new Date().toISOString()}] generateInvoiceNumber: Counter fetched/updated`, { counter });
    const seq = String(counter.seq).padStart(3, "0");
    const invoiceNumber = `${prefix}-${year}-${month}-${day}-${seq}`;
    console.log(`[${new Date().toISOString()}] generateInvoiceNumber: Generated invoice number=${invoiceNumber}`);
    return invoiceNumber;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] generateInvoiceNumber: Error`, { error: error.message });
    throw error;
  }
};

// Calculate invoice totals with debugging
const calculateInvoiceTotals = (items) => {
  console.log(`[${new Date().toISOString()}] calculateInvoiceTotals: Calculating totals for items`, { items });
  try {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * (item.discountPercent || 0)) / 100;
    }, 0);
    const totalAmount = subtotal - discountAmount;
    console.log(`[${new Date().toISOString()}] calculateInvoiceTotals: Calculated`, {
      subtotal,
      discountAmount,
      totalAmount,
    });
    return { subtotal, discountAmount, totalAmount };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] calculateInvoiceTotals: Error`, { error: error.message });
    throw error;
  }
};

// Save purchase invoice
const save = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { date, dueDate, reference, supplier, description, items } = req.body;

    if (!date || !dueDate || !supplier || !items?.length) {
      throw new Error("All required fields must be provided");
    }

    const parsedDate = new Date(date);
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDate) || isNaN(parsedDueDate)) {
      throw new Error("Invalid date format");
    }
    if (parsedDueDate < parsedDate) {
      throw new Error("Due date must be after issue date");
    }

    const supplierDoc = await Supplier.findById(supplier).session(session);
    if (!supplierDoc) {
      throw new Error("Supplier not found");
    }

    for (const { item, quantity, unitPrice, discountPercent } of items) {
      if (!item || !quantity || !unitPrice) {
        throw new Error("Invalid item data");
      }
      const itemDoc = await Item.findById(item).session(session);
      if (!itemDoc) {
        throw new Error(`Item ${item} not found`);
      }
      const parsedQuantity = parseInt(quantity);
      const parsedUnitPrice = parseFloat(unitPrice);
      const parsedDiscountPercent = parseFloat(discountPercent || 0);
      if (parsedQuantity < 1 || parsedUnitPrice < 0 || parsedDiscountPercent < 0 || parsedDiscountPercent > 100) {
        throw new Error("Invalid quantity, unit price, or discount percentage");
      }
    }

    if (reference) {
      const existingInvoice = await PurchaseInvoice.findOne({ reference, isDeleted: false }).session(session);
      if (existingInvoice) {
        throw new Error("Reference already exists");
      }
    }

    const { subtotal, discountAmount, totalAmount } = calculateInvoiceTotals(items);
    const invoiceNumber = await generateInvoiceNumber("PI", session);

    const invoice = new PurchaseInvoice({
      invoiceNumber,
      date: parsedDate,
      dueDate: parsedDueDate,
      reference: reference?.trim(),
      supplier,
      supplierAddress: supplierDoc.address,
      description: description?.trim(),
      items: items.map((i) => ({
        item: i.item,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        discountPercent: parseFloat(i.discountPercent || 0),
      })),
      subtotal,
      discountAmount,
      totalAmount,
      status: "pending",
      createdBy: req.user?.id || "system",
    });

    await invoice.save({ session });
    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Purchase invoice created", data: invoice });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.message.includes("required") || error.message.includes("not found") || error.message.includes("Invalid") || error.message.includes("Reference") ? 400 : 500).json({
      success: false,
      message: `Error creating purchase invoice: ${error.message}`,
    });
  } finally {
    session.endSession();
  }
};

// View purchase invoices
const view = async (req, res) => {
  try {
    const { page = 1, limit = 7, search = "", status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ success: false, message: "Invalid page or limit" });
    }

    const skip = (pageNum - 1) * limitNum;
    const query = { isDeleted: false };
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const [totalInvoices, invoices] = await Promise.all([
      PurchaseInvoice.countDocuments(query),
      PurchaseInvoice.find(query)
        .populate("supplier", "name")
        .populate("items.item", "name unit")
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      totalInvoices,
      totalPages: Math.ceil(totalInvoices / limitNum),
      currentPage: pageNum,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Error fetching purchase invoices: ${error.message}` });
  }
};

module.exports = { save, view };