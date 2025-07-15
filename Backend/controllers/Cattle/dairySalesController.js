const mongoose = require("mongoose");
const DairySales = require("../../models/Cattle/dairySales");
const DairyProduct = require("../../models/Cattle/dairyProduct");
const DairyInventory = require("../../models/Cattle/dairyInventory");
const Customer = require("../../models/Inventory/customerModel"); 
const ChartAccount = require("../../models/Finance/chartAccountsModel");

const save = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { date, reference, customer, description, items, totalPrice } = req.body;
        if (!date || !customer || !items?.length || totalPrice === undefined) {
            throw new Error("All required fields (date, customer, items, totalPrice) must be provided");
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            throw new Error("Invalid date format");
        }
        const customerDoc = await Customer.findById(customer).session(session);
        if (!customerDoc) {
            throw new Error("Customer not found");
        }
        let calculatedTotal = 0;
        for (const { item, quantity, unitPrice } of items) {
            if (!item || quantity === undefined || unitPrice === undefined) {
                throw new Error("Invalid item data: item, quantity, and unitPrice are required");
            }
            const itemDoc = await DairyProduct.findById(item).session(session);
            if (!itemDoc) {
                throw new Error(`Product with ID ${item} not found`);
            }
            const parsedQuantity = parseFloat(quantity);
            const parsedUnitPrice = parseFloat(unitPrice);
            if (parsedQuantity < 1 || parsedUnitPrice < 0) {
                throw new Error("Quantity must be at least 1 and unit price cannot be negative");
            }
            calculatedTotal += parsedQuantity * parsedUnitPrice;
        }
        const parsedTotalPrice = parseFloat(totalPrice);
        if (Math.abs(parsedTotalPrice - calculatedTotal) > 0.01) {
            throw new Error("Total price does not match the sum of item amounts");
        }
        if (reference) {
            const existingInvoice = await DairySales.findOne({ reference, isDeleted: false }).session(session);
            if (existingInvoice) {
                throw new Error("Reference already exists");
            }
        }
        const invoiceCount = await DairySales.countDocuments({ isDeleted: false }).session(session);
        const invoiceNumber = `SI-${String(invoiceCount + 1).padStart(6, "0")}`;
        const sale = new DairySales({
            date: parsedDate,
            reference: reference?.trim(),
            customer,
            description: description?.trim(),
            items: items.map((i) => ({
                item: i.item,
                quantity: parseFloat(i.quantity),
                unitPrice: parseFloat(i.unitPrice),
            })),
            totalPrice: parsedTotalPrice,
            invoiceNumber,
            status: "pending",
            inventoryProcessed: false,
        });
        await sale.save({ session });
        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Sales invoice created", data: sale });
    } catch (error) {
        await session.abortTransaction();
        res.status(
            error.message.includes("required") ||
                error.message.includes("not found") ||
                error.message.includes("Invalid") ||
                error.message.includes("Reference")
                ? 400
                : 500
        ).json({ success: false, message: `Error creating sales invoice: ${error.message}` });
    } finally {
        session.endSession();
    }
};

const view = async (req, res) => {
    try {
        const { page = 1, limit = 7, search = "", status, sortBy = "date", sortOrder = "desc" } = req.query;

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
                { invoiceNumber: { $regex: search, $options: "i" } },
            ];
        }
        if (status) {
            query.status = status;
        }

        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

        const [totalInvoices, invoices] = await Promise.all([
            DairySales.countDocuments(query),
            DairySales.find(query)
                .populate("customer", "name")
                .populate({
                    path: "items.item",
                    select: "name unit",
                    populate: { path: "cattleInventoryAccount", select: "name" },
                })
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
        ]);

        // Fetch averageCost from DairyInventory
        const enhancedInvoices = await Promise.all(
            invoices.map(async (invoice) => {
                const enhancedItems = await Promise.all(
                    invoice.items.map(async (item) => {
                        const inventory = await DairyInventory.findOne({ productId: item.item._id }).lean();
                        return {
                            ...item.toObject(),
                            averageCost: inventory ? inventory.averageCost : item.item.standardCost || 0,
                        };
                    })
                );
                return { ...invoice.toObject(), items: enhancedItems };
            })
        );

        res.status(200).json({
            success: true,
            totalInvoices,
            totalPages: Math.ceil(totalInvoices / limitNum),
            currentPage: pageNum,
            data: enhancedInvoices,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching sales invoices: ${error.message}` });
    }
};

module.exports = { save, view };