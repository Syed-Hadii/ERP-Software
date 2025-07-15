const mongoose = require('mongoose');
const FeedProcess = require('../../models/Cattle/feed-process');
const Inventory = require('../../models/Inventory/inventory');

/**
 * Process feed: deduct inputs from cattle inventory, add output to cattle inventory
 */
exports.processFeed = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { inputProducts, outputProduct, operator } = req.body;


        // 1. Validate & deduct each input
        let totalInputCost = 0;
        for (const line of inputProducts) {
            const inv = await Inventory.findOne({ owner: "cattle", item: line.item }).session(session);
            if (!inv || inv.quantity < line.quantity) {
                throw new Error(`Insufficient stock for item ${line.item}`);
            }
            const itemCost = Number(line.quantity) * inv.averageCost;
            totalInputCost += itemCost;
            inv.quantity -= Number(line.quantity);
            inv.totalCost -= itemCost;
            await inv.save({ session });
        }

        // 2. Add output to inventory (or create if not exists)
        let outInv = await Inventory.findOne({ owner: "cattle", item: outputProduct.item }).session(session);
        const outputQuantity = Number(outputProduct.quantity);
        if (!outInv) {
            outInv = new Inventory({
                owner: "cattle",
                item: outputProduct.item,
                quantity: outputQuantity,
                totalCost: totalInputCost,
                averageCost: outputQuantity > 0 ? totalInputCost / outputQuantity : 0,
                unit: req.body.unit || 'kg'
            });
        } else {
            outInv.quantity += outputQuantity;
            outInv.totalCost += totalInputCost;
            outInv.averageCost = outInv.quantity > 0 ? outInv.totalCost / outInv.quantity : 0;
        }
        await outInv.save({ session });

        // 3. Record the feed process
        const feedProc = new FeedProcess({ inputProducts, outputProduct, operator });
        await feedProc.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Feed processed successfully', data: feedProc });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(error.message.includes("Insufficient") ? 400 : 500).json({
            success: false,
            message: `Error processing feed: ${error.message}`
        });
    }
};