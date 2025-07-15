const mongoose = require('mongoose');
const FeedUsage = require('../../models/Cattle/feedUsage');
const Inventory = require('../../models/Inventory/inventory');
const Item = require('../../models/Inventory/itemModel');
const ChartAccount = require('../../models/Finance/chartAccountsModel'); 

exports.logFeedUsage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { cattleId, productId, quantityUsed, operator, notes } = req.body;

        // Validate inventory
        const inv = await Inventory.findOne({ item: productId, owner: 'cattle' }).session(session);
        if (!inv || inv.quantity < quantityUsed) {
            throw new Error('Insufficient stock');
        }

        // Get item for cattleInventoryAccount
        const item = await Item.findById(productId).session(session);
        if (!item || !item.cattleInventoryAccount) {
            throw new Error('Item or cattle inventory account not found');
        }

        // Calculate cost
        const feedCost = Number(quantityUsed) * inv.averageCost;

        // Deduct from inventory
        inv.quantity -= Number(quantityUsed);
        inv.totalCost -= feedCost;
        await inv.save({ session });

        // Update COA
        const cogsAccount = await ChartAccount.findOne({ name: 'Cost of Goods Sold', group: 'Expense' }).session(session);
        const cattleInventoryAccount = await ChartAccount.findById(item.cattleInventoryAccount).session(session);
        if (!cogsAccount || !cattleInventoryAccount) {
            throw new Error('Cost of Goods Sold or cattle inventory account not found');
        }

        cogsAccount.currentBalance += feedCost;
        cattleInventoryAccount.currentBalance -= feedCost;
        await Promise.all([
            cogsAccount.save({ session }),
            cattleInventoryAccount.save({ session })
        ]);



        // Record usage
        const usage = await FeedUsage.create([{ cattleId, productId, quantityUsed, operator, notes }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: usage[0] });
    } catch (err) {
        await session.abortTransaction();
        res.status(err.message.includes('Insufficient') || err.message.includes('not found') ? 400 : 500).json({
            success: false,
            message: `Error logging feed usage: ${err.message}`
        });
    } finally {
        session.endSession();
    }
};

exports.listFeedUsage = async (req, res) => {
    try {
        const { page = 1, limit = 10, cattleId, fromDate, toDate } = req.query;
        const query = {};
        if (cattleId) query.cattleId = cattleId;
        if (fromDate || toDate) query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);

        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            FeedUsage.find(query)
                .populate('cattleId', 'cattleId')
                .populate('productId', 'name unit')
                .populate('operator', 'name')
                .sort('-date')
                .skip(skip)
                .limit(parseInt(limit)),
            FeedUsage.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: records,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};