const mongoose = require("mongoose");
const PurchaseInvoice = require("../../models/Inventory/PurchaseInvoice");
const DairySales = require("../../models/Cattle/dairySales");
const Item = require("../../models/Inventory/itemModel");
const DairyProduct = require("../../models/Cattle/dairyProduct");
const Supplier = require("../../models/Inventory/supplierModel");
const Customer = require("../../models/Inventory/customerModel");
const Inventory = require("../../models/Inventory/inventory");
const DairyInventory = require("../../models/Cattle/dairyInventory");
const ChartAccount = require("../../models/Finance/chartAccountsModel");

const getInvoices = async (req, res) => {
    // Unchanged, keeping as provided
    try {
        const { page = 1, limit = 7, search = "", status, type } = req.query;
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

        let totalInvoices = 0;
        let invoices = [];

        if (!type || type === "purchase") {
            const [total, purchaseInvoices] = await Promise.all([
                PurchaseInvoice.countDocuments(query),
                PurchaseInvoice.find(query)
                    .populate("supplier", "name")
                    .populate("items.item", "name unit")
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
            ]);
            totalInvoices += total;
            invoices = invoices.concat(purchaseInvoices.map((inv) => ({ ...inv, type: "purchase" })));
        }

        if (!type || type === "sales") {
            const [total, salesInvoices] = await Promise.all([
                DairySales.countDocuments(query),
                DairySales.find(query)
                    .populate("customer", "name")
                    .populate("items.item", "name unit")
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
            ]);
            totalInvoices += total;
            invoices = invoices.concat(salesInvoices.map((inv) => ({ ...inv, type: "sales" })));
        }

        res.status(200).json({
            success: true,
            totalInvoices,
            totalPages: Math.ceil(totalInvoices / limitNum),
            currentPage: pageNum,
            data: invoices,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching invoices: ${error.message}` });
    }
};

const getInvoiceById = async (req, res) => {
    // Unchanged, keeping as provided
    try {
        const { id, type } = req.params;
        let invoice;

        if (type === "purchase") {
            invoice = await PurchaseInvoice.findById(id)
                .populate("supplier", "name")
                .populate("items.item", "name unit")
                .lean();
        } else if (type === "sales") {
            invoice = await DairySales.findById(id)
                .populate("customer", "name")
                .populate("items.item", "name unit")
                .lean();
        } else {
            return res.status(400).json({ success: false, message: "Invalid invoice type" });
        }

        if (!invoice || invoice.isDeleted) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }
        res.status(200).json({ success: true, data: { ...invoice, type } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching invoice: ${error.message}` });
    }
};

const approveInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id, type, approvedBy } = req.body;
        if (!id || !type || !approvedBy) {
            throw new Error("Invoice ID, type, and approvedBy are required.");
        }
        if (!["purchase", "sales"].includes(type)) {
            throw new Error("Invalid invoice type.");
        }

        if (type === "purchase") {
            const invoice = await PurchaseInvoice.findById(id).populate("items.item").session(session);
            if (!invoice || invoice.isDeleted) {
                throw new Error("Invoice not found.");
            }
            if (invoice.status !== "pending") {
                throw new Error("Invoice is not in pending status.");
            }
            const supplierDoc = await Supplier.findById(invoice.supplier).session(session);
            if (!supplierDoc) {
                throw new Error("Supplier not found.");
            }
            const accountsPayable = await ChartAccount.findById(supplierDoc.coaId).session(session);
            if (!accountsPayable) {
                throw new Error("Accounts Payable account not found.");
            }
            let discountAccount = await ChartAccount.findOne({ name: "Discount Received", group: "Income" }).session(session);
            if (!discountAccount) {
                discountAccount = await ChartAccount.create(
                    [{
                        name: "Discount Received",
                        group: "Income",
                        category: "Other Income",
                        isTaxAccount: true,
                        currentBalance: 0,
                        openingBalance: 0,
                        createdBy: 'system'
                    }],
                    { session }
                );
                discountAccount = discountAccount[0];
            }

            const inventoryAccounts = {};
            for (const { item, quantity, unitPrice, discountPercent } of invoice.items) {
                const parsedQuantity = parseInt(quantity);
                const parsedUnitPrice = parseFloat(unitPrice);
                const itemCost = parsedQuantity * parsedUnitPrice;
                const discount = discountPercent ? (itemCost * parseFloat(discountPercent)) / 100 : 0;

                // Update inventory
                const currentInventory = await Inventory.findOne({ item: item._id, owner: "manager" }).session(session);
                const currentQuantity = currentInventory?.quantity || 0;
                const currentTotalCost = currentInventory?.totalCost || 0;
                const newQuantity = currentQuantity + parsedQuantity;
                const newTotalCost = currentTotalCost + itemCost;
                const newAverageCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;

                await Inventory.findOneAndUpdate(
                    { item: item._id, owner: "manager" },
                    {
                        $inc: { quantity: parsedQuantity, totalCost: itemCost },
                        $set: {
                            averageCost: newAverageCost,
                            unit: item.unit,
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true, session }
                );

                if (!inventoryAccounts[item.managerInventoryAccount]) {
                    inventoryAccounts[item.managerInventoryAccount] = 0;
                }
                inventoryAccounts[item.managerInventoryAccount] += (itemCost - discount);
            }

            // Update COA balances
            accountsPayable.currentBalance += invoice.totalAmount;
            await accountsPayable.save({ session });

            await Promise.all(
                Object.keys(inventoryAccounts).map(async (accountId) => {
                    const acc = await ChartAccount.findById(accountId).session(session);
                    if (!acc) {
                        throw new Error(`Manager Inventory account ${accountId} not found.`);
                    }
                    acc.currentBalance += inventoryAccounts[accountId];
                    await acc.save({ session });
                })
            );

            if (invoice.discountAmount > 0) {
                discountAccount.currentBalance += invoice.discountAmount;
                await discountAccount.save({ session });
            }

            // Update supplier transaction history
            supplierDoc.currentBalance += invoice.totalAmount;
            supplierDoc.transactionHistory.push({
                date: invoice.date || new Date(),
                type: 'Purchase',
                amount: invoice.totalAmount,
                reference: invoice.reference || `INV-${invoice._id}`,
                description: `Purchase invoice approved: ${invoice.description || 'No description'}`,
                balance: supplierDoc.currentBalance
            });
            await supplierDoc.save({ session });

            invoice.status = "approved";
            await invoice.save({ session });
            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Purchase invoice approved", data: invoice });
        } else if (type === "sales") {
            const invoice = await DairySales.findById(id).populate({
                path: "items.item",
                populate: { path: "cattleInventoryAccount incomeAccount" }
            }).session(session);

            if (!invoice || invoice.isDeleted) throw new Error("Invoice not found.");
            if (invoice.status !== "pending") throw new Error("Invoice is not pending.");
            if (invoice.inventoryProcessed) throw new Error("Invoice already processed.");

            // Validate customer and accounts
            const customerDoc = await Customer.findById(invoice.customer).session(session);
            if (!customerDoc) throw new Error("Customer not found.");

            const accountsReceivable = await ChartAccount.findById(customerDoc.coaId).session(session);
            if (!accountsReceivable) throw new Error("Accounts Receivable account not found.");

            // Get or create COGS account
            let cogsAccount = await ChartAccount.findOne({
                name: "Cost of Goods Sold",
                group: "Expense"
            }).session(session);

            if (!cogsAccount) {
                cogsAccount = await ChartAccount.create([{
                    name: "Cost of Goods Sold",
                    group: "Expense",
                    category: "Direct Expense",
                    currentBalance: 0,
                    openingBalance: 0,
                    createdBy: 'system'
                }], { session });
                cogsAccount = cogsAccount[0];
            }

            // Process each item
            for (const itemRow of invoice.items) {
                const { item, quantity, unitPrice } = itemRow;
                const parsedQty = parseFloat(quantity);
                const parsedPrice = parseFloat(unitPrice);

                // Get current inventory
                const inventory = await DairyInventory.findOne({
                    productId: item._id
                }).session(session);

                if (!inventory || inventory.quantity < parsedQty) {
                    throw new Error(`Insufficient stock for ${item.name}`);
                }

                // Calculate ACTUAL COGS (not standard cost)
                const actualCostPerUnit = inventory.averageCost;
                const totalCOGS = parsedQty * actualCostPerUnit;

                // Update inventory (quantity and cost)
                inventory.quantity -= parsedQty;
                inventory.totalCost -= totalCOGS;
                inventory.averageCost = inventory.quantity > 0 ?
                    inventory.totalCost / inventory.quantity : 0;
                await inventory.save({ session });

                // Update accounts
                const updates = [
                    // Deduct from inventory asset account
                    ChartAccount.findByIdAndUpdate(
                        item.cattleInventoryAccount,
                        { $inc: { currentBalance: -totalCOGS } },
                        { session }
                    ),
                    // Add to COGS expense account
                    ChartAccount.findByIdAndUpdate(
                        cogsAccount._id,
                        { $inc: { currentBalance: totalCOGS } },
                        { session }
                    ),
                    // Add to income account
                    ChartAccount.findByIdAndUpdate(
                        item.incomeAccount,
                        { $inc: { currentBalance: parsedQty * parsedPrice } },
                        { session }
                    )
                ];
                await Promise.all(updates);

                // Store actual cost in the invoice for reporting
                itemRow.actualCost = actualCostPerUnit; // NEW FIELD
            }

            // Update invoice and customer
            accountsReceivable.currentBalance += invoice.totalPrice;
            await accountsReceivable.save({ session });

            customerDoc.currentBalance += invoice.totalPrice;
            customerDoc.transactionHistory.push({
                date: invoice.date || new Date(),
                type: 'Sale',
                amount: invoice.totalPrice,
                reference: invoice.reference || `INV-${invoice._id}`,
                description: `Sale approved: ${invoice.description || 'No description'}`,
                balance: customerDoc.currentBalance
            });
            await customerDoc.save({ session });

            invoice.inventoryProcessed = true;
            invoice.status = "approved";
            await invoice.save({ session });
            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Sales invoice approved", data: invoice });
        }
    } catch (error) {
        await session.abortTransaction();
        res.status(
            error.message.includes("required") ||
                error.message.includes("not found") ||
                error.message.includes("status") ||
                error.message.includes("Invalid") ||
                error.message.includes("Insufficient") ||
                error.message.includes("processed") ||
                error.message.includes("Negative")
                ? 400
                : 500
        ).json({
            success: false,
            message: `Error approving invoice: ${error.message}`,
        });
    } finally {
        session.endSession();
    }
};

const rejectInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id, type, approvedBy } = req.body;
        if (!id || !type || !approvedBy) {
            throw new Error("Invoice ID, type, and approvedBy are required.");
        }
        if (!["purchase", "sales"].includes(type)) {
            throw new Error("Invalid invoice type.");
        }
        let invoice;
        if (type === "purchase") {
            invoice = await PurchaseInvoice.findById(id).session(session);
            if (!invoice || invoice.isDeleted) {
                throw new Error("Invoice not found.");
            }
            if (invoice.status !== "pending") {
                throw new Error("Invoice is not in pending status.");
            }
            invoice.status = "rejected";
            await invoice.save({ session });
            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Purchase invoice rejected", data: invoice });
        } else if (type === "sales") {
            invoice = await DairySales.findById(id).populate("items.item").session(session);
            if (!invoice || invoice.isDeleted) {
                throw new Error("Invoice not found.");
            }
            if (invoice.status !== "pending" && !invoice.inventoryProcessed) {
                throw new Error("Invoice is not in pending status or not approved.");
            }
            if (invoice.inventoryProcessed) {
                const customerDoc = await Customer.findById(invoice.customer).session(session);
                if (!customerDoc) {
                    throw new Error("Customer not found.");
                }
                const accountsReceivable = await ChartAccount.findById(customerDoc.coaId).session(session);
                if (!accountsReceivable) {
                    throw new Error("Accounts Receivable account not found.");
                }
                let cogsAccount = await ChartAccount.findOne({ name: "Cost of Goods Sold", group: "Expense" }).session(session);
                if (!cogsAccount) {
                    cogsAccount = await ChartAccount.create(
                        [{
                            name: "Cost of Goods Sold",
                            group: "Expense",
                            category: "Cost of Goods Sold",
                            currentBalance: 0,
                            openingBalance: 0,
                            createdBy: 'system'
                        }],
                        { session }
                    );
                    cogsAccount = cogsAccount[0];
                }

                for (const { item, quantity, unitPrice } of invoice.items) {
                    const parsedQuantity = parseFloat(quantity);
                    const parsedUnitPrice = parseFloat(unitPrice);
                    const inventoryDoc = await DairyInventory.findOne({ productId: item._id }).session(session);
                    const inventoryCost = parsedQuantity * (inventoryDoc.averageCost || item.standardCost || 0);

                    // Revert inventory
                    const currentQuantity = inventoryDoc?.quantity || 0;
                    const currentTotalCost = inventoryDoc?.totalCost || 0;
                    const newQuantity = currentQuantity + parsedQuantity;
                    const newTotalCost = currentTotalCost + inventoryCost;
                    const newAverageCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
                    await DairyInventory.findOneAndUpdate(
                        { productId: item._id },
                        {
                            $set: {
                                quantity: newQuantity,
                                totalCost: newTotalCost,
                                averageCost: newAverageCost,
                                lastUpdated: new Date(),
                            },
                        },
                        { session }
                    );

                    // Revert accounts
                    const inventoryAccount = await ChartAccount.findById(item.cattleInventoryAccount).session(session);
                    if (!inventoryAccount) {
                        throw new Error(`Cattle inventory account ${item.cattleInventoryAccount} not found.`);
                    }
                    inventoryAccount.currentBalance += inventoryCost;
                    await inventoryAccount.save({ session });

                    const incomeAccount = await ChartAccount.findById(item.incomeAccount).session(session);
                    if (!incomeAccount) {
                        throw new Error(`Income account ${item.incomeAccount} not found.`);
                    }
                    incomeAccount.currentBalance -= parsedQuantity * parsedUnitPrice;
                    await incomeAccount.save({ session });

                    cogsAccount.currentBalance -= inventoryCost;
                    await cogsAccount.save({ session });
                }

                accountsReceivable.currentBalance -= invoice.totalPrice;
                await accountsReceivable.save({ session });

                // Update customer transaction history for reversal
                customerDoc.currentBalance -= invoice.totalPrice;
                customerDoc.transactionHistory.push({
                    date: new Date(),
                    type: 'Credit Note Issued',
                    amount: -invoice.totalPrice,
                    reference: invoice.reference || `INV-${invoice._id}`,
                    description: `Sales invoice rejected: ${invoice.description || 'No description'}`,
                    balance: customerDoc.currentBalance
                });
                await customerDoc.save({ session });

                invoice.inventoryProcessed = false;
            }
            invoice.status = "rejected";
            await invoice.save({ session });
            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Sales invoice rejected", data: invoice });
        }
    } catch (error) {
        await session.abortTransaction();
        res.status(
            error.message.includes("required") ||
                error.message.includes("not found") ||
                error.message.includes("status") ||
                error.message.includes("Invalid")
                ? 400
                : 500
        ).json({
            success: false,
            message: `Error rejecting invoice: ${error.message}`,
        });
    } finally {
        session.endSession();
    }
};

module.exports = { getInvoices, getInvoiceById, approveInvoice, rejectInvoice };