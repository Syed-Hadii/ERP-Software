const mongoose = require("mongoose");
const DairyInventory = require("../../models/Cattle/dairyInventory");
const DairyProcessing = require("../../models/Cattle/dairyProcessing");
const DairyProduct = require("../../models/Cattle/dairyProduct");
const ChartAccount = require("../../models/Finance/chartAccountsModel");



// Create dairy processing record
exports.createDairyProcessing = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { rawMilkProductId, inputMilkQuantity, employee, outputProducts, notes, date, status } = req.body;
        if (!rawMilkProductId || !inputMilkQuantity || !employee || !outputProducts?.length) {
            throw new Error("All required fields (rawMilkProductId, inputMilkQuantity, employee, outputProducts) must be provided");
        }
        const rawMilkProduct = await DairyProduct.findById(rawMilkProductId).session(session);
        if (!rawMilkProduct) {
            throw new Error("Raw milk product not found");
        }
        const employeeExists = await mongoose.model("Employee").findById(employee).session(session);
        if (!employeeExists) {
            throw new Error("Employee not found");
        }
        for (const output of outputProducts) {
            const product = await DairyProduct.findById(output.productId).session(session);
            if (!product) {
                throw new Error(`Output product with ID ${output.productId} not found`);
            }
            if (parseFloat(output.quantity) <= 0) {
                throw new Error("Output quantity must be greater than 0");
            }
        }
        const dairyProcessing = new DairyProcessing({
            rawMilkProductId,
            inputMilkQuantity: parseFloat(inputMilkQuantity),
            employee,
            outputProducts: outputProducts.map((op) => ({
                productId: op.productId,
                quantity: parseFloat(op.quantity),
            })),
            notes,
            date: date || Date.now(),
            status: status || "pending",
            inventoryProcessed: false,
        });
        const savedProcessing = await dairyProcessing.save({ session });
        await savedProcessing.populate("rawMilkProductId outputProducts.productId");
        await session.commitTransaction();
        res.status(201).json({ success: true, data: savedProcessing });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Update dairy processing record
exports.updateDairyProcessing = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { rawMilkProductId, inputMilkQuantity, employee, outputProducts, notes, date, status } = req.body;
        const oldProcessing = await DairyProcessing.findById(req.params.id).session(session);
        if (!oldProcessing) {
            throw new Error("Processing record not found");
        }
        if (oldProcessing.status === "completed" || oldProcessing.status === "cancelled") {
            throw new Error("Cannot update completed or cancelled processing record");
        }
        const rawMilkProduct = await DairyProduct.findById(rawMilkProductId).session(session);
        if (!rawMilkProduct) {
            throw new Error("Raw milk product not found");
        }
        const employeeExists = await mongoose.model("Employee").findById(employee).session(session);
        if (!employeeExists) {
            throw new Error("Employee not found");
        }
        for (const output of outputProducts) {
            const product = await DairyProduct.findById(output.productId).session(session);
            if (!product) {
                throw new Error(`Output product with ID ${output.productId} not found`);
            }
            if (parseFloat(output.quantity) <= 0) {
                throw new Error("Output quantity must be greater than 0");
            }
        }
        const updatedProcessing = await DairyProcessing.findByIdAndUpdate(
            req.params.id,
            {
                rawMilkProductId,
                inputMilkQuantity: parseFloat(inputMilkQuantity),
                employee,
                outputProducts: outputProducts.map((op) => ({
                    productId: op.productId,
                    quantity: parseFloat(op.quantity),
                })),
                notes,
                date,
                status,
                inventoryProcessed: false,
            },
            { new: true, runValidators: true, session }
        ).populate("rawMilkProductId outputProducts.productId");
        await session.commitTransaction();
        res.status(200).json({ success: true, data: updatedProcessing });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Update dairy processing status
exports.updateStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { status } = req.body;
        const processing = await DairyProcessing.findById(req.params.id).session(session);
        if (!processing) {
            throw new Error("Processing record not found");
        }
        if (status === processing.status) {
            throw new Error("New status must be different from current status");
        }
        const rawMilkInventory = await DairyInventory.findOne({ productId: processing.rawMilkProductId }).session(session);
        if (!rawMilkInventory) {
            throw new Error("Raw milk inventory not found");
        }
        const rawMilkProduct = await DairyProduct.findById(processing.rawMilkProductId).session(session);
        if (!rawMilkProduct) {
            throw new Error("Raw milk product not found");
        }
        if (!rawMilkProduct.cattleInventoryAccount) {
            throw new Error("Raw milk product cattle inventory account not set");
        }
        const rawMilkAccount = await ChartAccount.findById(rawMilkProduct.cattleInventoryAccount).session(session);
        if (!rawMilkAccount) {
            throw new Error(`Raw milk cattle inventory account ${rawMilkProduct.cattleInventoryAccount} not found`);
        }
        if (status === "completed" && !processing.inventoryProcessed) {
            // Validate inventory
            if (rawMilkInventory.quantity < processing.inputMilkQuantity) {
                throw new Error(`Insufficient raw milk: ${rawMilkInventory.quantity} available`);
            }
            // Use averageCost, fallback to standardCost
            const inputCost = parseFloat(processing.inputMilkQuantity) * (rawMilkInventory.averageCost || 0);
            // Update inventory for input
            rawMilkInventory.quantity -= parseFloat(processing.inputMilkQuantity);
            rawMilkInventory.totalCost -= inputCost;
            rawMilkInventory.averageCost = rawMilkInventory.quantity > 0 ? rawMilkInventory.totalCost / rawMilkInventory.quantity : 0;
            await rawMilkInventory.save({ session });

            // Update raw milk cattleInventoryAccount
            rawMilkAccount.currentBalance -= inputCost;
            await rawMilkAccount.save({ session });


            for (const output of processing.outputProducts) {
                const product = await DairyProduct.findById(output.productId).session(session);
                if (!product) {
                    throw new Error(`Output product ${output.productId} not found`);
                }
                if (!product.cattleInventoryAccount) {
                    throw new Error(`Cattle inventory account not set for product ${product.name}`);
                }
                // Transfer input cost proportionally
                const outputProportion = parseFloat(output.quantity) / processing.outputProducts.reduce((sum, op) => sum + parseFloat(op.quantity), 0);
                const outputCost = inputCost * outputProportion;
                const currentInventory = await DairyInventory.findOne({ productId: output.productId }).session(session);
                const currentQuantity = currentInventory ? currentInventory.quantity : 0;
                const currentTotalCost = currentInventory ? currentInventory.totalCost : 0;
                const newQuantity = currentQuantity + parseFloat(output.quantity);
                const newTotalCost = currentTotalCost + outputCost;
                const newAverageCost = newQuantity > 0 ? newTotalCost / newQuantity : (product.standardCost || 0);
                await DairyInventory.findOneAndUpdate(
                    { productId: output.productId },
                    {
                        $set: {
                            quantity: newQuantity,
                            totalCost: newTotalCost,
                            averageCost: newAverageCost,
                            lastUpdated: new Date(),
                        },
                    },
                    { upsert: true, session }
                );
                await ChartAccount.findByIdAndUpdate(
                    product.cattleInventoryAccount,
                    { $inc: { currentBalance: outputCost } },
                    { session }
                );

            }

            processing.inventoryProcessed = true;
        } else if (status === "cancelled" && processing.inventoryProcessed) {
            // Revert inventory and accounts
            const inputCost = parseFloat(processing.inputMilkQuantity) * (rawMilkInventory.averageCost || rawMilkProduct.standardCost || 0);
            rawMilkInventory.quantity += parseFloat(processing.inputMilkQuantity);
            rawMilkInventory.totalCost += inputCost;
            rawMilkInventory.averageCost = rawMilkInventory.quantity > 0 ? rawMilkInventory.totalCost / rawMilkInventory.quantity : 0;
            await rawMilkInventory.save({ session });

            rawMilkAccount.currentBalance += inputCost;
            await rawMilkAccount.save({ session });


            for (const output of processing.outputProducts) {
                const product = await DairyProduct.findById(output.productId).session(session);
                if (!product) {
                    throw new Error(`Output product ${output.productId} not found`);
                }
                const outputProportion = parseFloat(output.quantity) / processing.outputProducts.reduce((sum, op) => sum + parseFloat(op.quantity), 0);
                const outputCost = inputCost * outputProportion;
                const currentInventory = await DairyInventory.findOne({ productId: output.productId }).session(session);
                const currentQuantity = currentInventory ? currentInventory.quantity : 0;
                const currentTotalCost = currentInventory ? currentInventory.totalCost : 0;
                const newQuantity = currentQuantity - parseFloat(output.quantity);
                const newTotalCost = currentTotalCost - outputCost;
                const newAverageCost = newQuantity > 0 ? newTotalCost / newQuantity : (product.standardCost || 0);
                await DairyInventory.findOneAndUpdate(
                    { productId: output.productId },
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
                await ChartAccount.findByIdAndUpdate(
                    product.cattleInventoryAccount,
                    { $inc: { currentBalance: -outputCost } },
                    { session }
                );

            }

            processing.inventoryProcessed = false;
        }
        const updatedProcessing = await DairyProcessing.findByIdAndUpdate(
            req.params.id,
            { status, inventoryProcessed: processing.inventoryProcessed },
            { new: true, runValidators: true, session }
        ).populate("rawMilkProductId outputProducts.productId");
        await session.commitTransaction();
        res.status(200).json({ success: true, data: updatedProcessing });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// Fetch raw milk options for select box
exports.getRawMilkOptions = async (req, res) => {
    try {
        const rawMilkProducts = await DairyProduct.find({
            name: { $in: ['Cow Raw Milk', 'Buffalo Raw Milk', 'Goat Raw Milk', 'Sheep Raw Milk'] }
        });
        const inventory = await DairyInventory.find({
            productId: { $in: rawMilkProducts.map(p => p._id) }
        }).populate('productId');
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching raw milk options', error: error.message });
    }
};

// Fetch dairy products for output product select box
exports.getDairyProducts = async (req, res) => {
    try {
        const products = await DairyProduct.find({
            name: { $nin: ['Cow Raw Milk', 'Buffalo Raw Milk', 'Goat Raw Milk', 'Sheep Raw Milk'] }
        });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching dairy products', error: error.message });
    }
};

// Get all dairy processing records
exports.getAllDairyProcessing = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = '-date' } = req.query;
        const skip = (page - 1) * limit;
        const [processing, total] = await Promise.all([
            DairyProcessing.find()
                .populate('rawMilkProductId outputProducts.productId')
                .sort(sortBy)
                .skip(skip)
                .limit(parseInt(limit)),
            DairyProcessing.countDocuments()
        ]);
        res.status(200).json({
            success: true,
            data: processing,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single dairy processing record
exports.getDairyProcessingById = async (req, res) => {
    try {
        const processing = await DairyProcessing.findById(req.params.id)
            .populate('rawMilkProductId outputProducts.productId');
        if (!processing) {
            return res.status(404).json({ success: false, message: 'Processing record not found' });
        }
        res.status(200).json({ success: true, data: processing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};