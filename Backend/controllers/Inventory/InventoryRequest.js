const mongoose = require("mongoose");
const InventoryRequest = require("../../models/Inventory/inventoryRequest");
const Inventory = require("../../models/Inventory/inventory");
const Item = require("../../models/Inventory/itemModel");
const Notification = require("../../models/notificationModel"); 
const ChartAccount = require("../../models/Finance/chartAccountsModel");

// Map requestorType to inventory owner and account field
const getOwnerAndAccountFieldFromRequestorType = (requestorType) => {
    return requestorType === "Crop Manager"
        ? { owner: "agriculture", accountField: "cropInventoryAccount" }
        : { owner: "cattle", accountField: "cattleInventoryAccount" };
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

// Create Inventory Request
exports.createRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { item, quantityRequested, details, requestorType } = req.body;
        console.log("Request body:", req.body);
        if (!item || !quantityRequested || !requestorType) {
            throw new Error("All required fields must be provided.");
        }
        if (quantityRequested <= 0) {
            throw new Error("Quantity requested must be greater than 0.");
        }
        const itemDoc = await Item.findById(item).session(session);
        if (!itemDoc) {
            throw new Error("Item not found.");
        }
        // Validate that managerInventoryAccount and target inventory account exist
        const targetAccountField = getOwnerAndAccountFieldFromRequestorType(requestorType).accountField;
        if (!itemDoc.managerInventoryAccount || !itemDoc[targetAccountField]) {
            throw new Error("Item is missing manager or target inventory account.");
        }
        const request = await InventoryRequest.create(
            [
                {
                    item,
                    quantityRequested: parseInt(quantityRequested),
                    details: details?.trim(),
                    requestorType,
                },
            ],
            { session }
        );
        const newNotification = await Notification.create(
            [
                {
                    type: "inventory-request",
                    title: `New Inventory Request`,
                    message: `A new request for ${quantityRequested} ${itemDoc.unit || "units"} of ${itemDoc.name} has been submitted.`,
                    domain: "inventory",
                    entityId: request[0]._id,
                    entityModel: "InventoryRequest",
                    dueDate: new Date(),
                    priority: "medium",
                    inventoryDetails: {
                        currentQuantity: parseInt(quantityRequested),
                        unit: itemDoc.unit || "units",
                    },
                },
            ],
            { session }
        );
        await session.commitTransaction();
        return res.json({ success: true, message: "Inventory request submitted.", data: request[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(error.message.includes("required") || error.message.includes("not found") || error.message.includes("Quantity") || error.message.includes("account") ? 400 : 500).json({
            success: false,
            message: `Error submitting request: ${error.message}`,
        });
    } finally {
        session.endSession();
    }
};

// Approve or Reject Inventory Request
exports.handleRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log("Handling request with ID:", id, "and status:", status);
        if (!id || !status) {
            throw new Error("Request ID and status are required.");
        }
        if (!["approved", "rejected"].includes(status)) {
            throw new Error("Invalid status.");
        }
        const request = await InventoryRequest.findById(id).populate("item").session(session);
        if (!request) {
            throw new Error("Request not found.");
        }
        if (request.status !== "pending") {
            throw new Error("Request already handled.");
        }
        request.status = status;
        request.handledAt = new Date();

        if (status === "approved") {
            const mainInventory = await Inventory.findOne({ item: request.item._id, owner: "manager" }).session(session);
            if (!mainInventory || mainInventory.quantity < request.quantityRequested) {
                throw new Error("Not enough stock in manager inventory.");
            }
            mainInventory.quantity -= parseInt(request.quantityRequested);
            mainInventory.totalCost = mainInventory.quantity * mainInventory.averageCost;
            await mainInventory.save({ session });

            const { owner: targetOwner, accountField: targetAccountField } = getOwnerAndAccountFieldFromRequestorType(request.requestorType);
            const transferCost = parseInt(request.quantityRequested) * mainInventory.averageCost;
            const targetInventory = await Inventory.findOneAndUpdate(
                { item: request.item._id, owner: targetOwner },
                {
                    $inc: { quantity: parseInt(request.quantityRequested), totalCost: transferCost },
                    $set: { averageCost: mainInventory.averageCost },
                },
                { new: true, upsert: true, setDefaultsOnInsert: true, session }
            );

            // Validate manager and target inventory accounts
            const managerInventoryAccount = await ChartAccount.findById(request.item.managerInventoryAccount).session(session);
            const targetInventoryAccount = await ChartAccount.findById(request.item[targetAccountField]).session(session);
            if (!managerInventoryAccount || !targetInventoryAccount) {
                throw new Error("Manager or target inventory account not found.");
            }

           

            // Update ChartAccount balances
            managerInventoryAccount.currentBalance -= transferCost;
            targetInventoryAccount.currentBalance += transferCost;
            await Promise.all([
                managerInventoryAccount.save({ session }),
                targetInventoryAccount.save({ session }),
            ]);
        }

        await request.save({ session });
        const statusText = status === "approved" ? "approved" : "rejected";
        const priority = status === "approved" ? "medium" : "high";
        const notification = await Notification.create(
            [
                {
                    type: "inventory-request-response",
                    title: `Inventory Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
                    message: `Your request for ${request.quantityRequested} ${request.item?.unit || "units"} of ${request.item?.name || "an item"} has been ${statusText}.`,
                    domain: request.requestorType === "Crop Manager" ? "agriculture" : "cattle",
                    entityId: request._id,
                    entityModel: "InventoryRequest",
                    dueDate: new Date(),
                    priority: priority,
                    inventoryDetails: {
                        currentQuantity: request.quantityRequested,
                        unit: request.item?.unit || "units",
                    },
                },
            ],
            { session }
        );
        await session.commitTransaction();
        return res.json({ success: true, message: `Request ${status}.`, data: request });
    } catch (error) {
        await session.abortTransaction();
        res.status(error.message.includes("required") || error.message.includes("not found") || error.message.includes("status") || error.message.includes("stock") || error.message.includes("account") ? 400 : 500).json({
            success: false,
            message: `Error handling request: ${error.message}`,
        });
    } finally {
        session.endSession();
    }
};

// View All Requests
exports.viewRequests = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10, search = "" } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type === "cattle") filter.requestorType = "Dairy Manager";
        if (type === "agriculture") filter.requestorType = "Crop Manager";
        if (search) {
            filter["item.name"] = { $regex: search, $options: "i" };
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (pageNum < 1 || limitNum < 1) {
            return res.status(400).json({ success: false, message: "Invalid page or limit" });
        }
        const skip = (pageNum - 1) * limitNum;
        const [total, requests] = await Promise.all([
            InventoryRequest.countDocuments(filter),
            InventoryRequest.find(filter)
                .populate("item", "name unit")
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 }),
        ]);
        return res.json({
            success: true,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            requests,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching requests: ${error.message}` });
    }
};