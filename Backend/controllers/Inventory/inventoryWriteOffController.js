const mongoose = require('mongoose');
const Inventory = require('../../models/Inventory/inventory');
const DairyInventory = require('../../models/Cattle/dairyInventory');
const ChartAccount = require('../../models/Finance/chartAccountsModel');
const DairyProduct = require('../../models/Cattle/dairyProduct');
const Item = require('../../models/Inventory/itemModel');

// Helper function to find or create Inventory Loss account
async function getOrCreateInventoryLossAccount(session) {
    let lossAccount = await ChartAccount.findOne({
        name: 'Inventory Loss',
        group: 'Expense',
        category: 'Operating Expense'
    }).session(session);

    if (!lossAccount) {
        lossAccount = new ChartAccount({
            code: `EXP-LOSS-${Date.now()}`,
            name: 'Inventory Loss',
            group: 'Expense',
            category: 'Operating Expense',
            nature: 'Debit',
            currentBalance: 0,
            openingBalance: 0,
            createdBy: 'system'
        });
        await lossAccount.save({ session });
    }

    return lossAccount;
}

// Main write-off function
async function createInventoryWriteOff({ itemId, dairyProductId, quantity, reason, owner, date = new Date() }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate inputs
        const quantityNum = parseFloat(quantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
            throw new Error('Quantity must be a positive number');
        }
        if (!itemId && !dairyProductId) {
            throw new Error('Either itemId or dairyProductId is required');
        }
        if (itemId && dairyProductId) {
            throw new Error('Cannot write off both regular item and dairy product simultaneously');
        }
        if (itemId && !mongoose.Types.ObjectId.isValid(itemId)) {
            throw new Error('Invalid itemId format');
        }

        const lossAccount = await getOrCreateInventoryLossAccount(session);
        let inventory, item, inventoryAccountField, inventoryAccount;

        if (itemId) {
            // Find item
            console.log('Querying Item with ID:', itemId);
            item = await Item.findById(itemId).session(session);
            console.log('Found Item:', item);

            if (!item) {
                throw new Error('Item not found');
            }

            // Find inventory
            console.log('Querying Inventory with itemId:', itemId, 'and owner:', owner);
            inventory = await Inventory.findOne({ item: itemId, owner }).session(session);
            console.log('Found Inventory:', inventory);

            if (!inventory) {
                throw new Error('Inventory not found for item and owner');
            }
            if (inventory.quantity < quantityNum) {
                throw new Error('Insufficient inventory quantity');
            }

            // Determine inventory account
            const accountFields = {
                manager: 'managerInventoryAccount',
                agriculture: 'cropInventoryAccount',
                cattle: 'cattleInventoryAccount'
            };
            inventoryAccountField = accountFields[owner];
            if (!inventoryAccountField) {
                throw new Error('Invalid owner type');
            }

            inventoryAccount = await ChartAccount.findById(item[inventoryAccountField]).session(session);
            if (!inventoryAccount) {
                throw new Error('Inventory account not found');
            }

            // Update inventory
            inventory.quantity -= quantityNum;
            inventory.totalCost = inventory.quantity * inventory.averageCost;
            await inventory.save({ session });

        } else if (dairyProductId) {
            // Handle dairy inventory (unchanged)
            inventory = await DairyInventory.findOne({ productId: dairyProductId }).session(session);
            item = await DairyProduct.findById(dairyProductId).session(session);

            if (!inventory || !item) {
                throw new Error('Dairy inventory or product not found');
            }
            if (inventory.quantity < quantityNum) {
                throw new Error('Insufficient dairy inventory quantity');
            }

            inventoryAccount = await ChartAccount.findById(item.cattleInventoryAccount).session(session);
            if (!inventoryAccount) {
                throw new Error('Dairy inventory account not found');
            }

            inventory.quantity -= quantityNum;
            inventory.totalCost = inventory.quantity * inventory.averageCost;
            await inventory.save({ session });
        }

        // Calculate write-off amount
        const writeOffAmount = quantityNum * inventory.averageCost;

        // Update accounts
        inventoryAccount.currentBalance -= writeOffAmount;
        lossAccount.currentBalance += writeOffAmount;

        await inventoryAccount.calculateAndUpdateParentBalance(session);
        await lossAccount.calculateAndUpdateParentBalance(session);

        await inventoryAccount.save({ session });
        await lossAccount.save({ session });

        // Create journal entry
        const journalEntry = {
            date,
            description: `Inventory Write-off: ${item.name} (${quantityNum} ${item.unit}) - ${reason}`,
            debit: [{ accountId: lossAccount._id, amount: writeOffAmount }],
            credit: [{ accountId: inventoryAccount._id, amount: writeOffAmount }],
            createdBy: 'system'
        };

        await session.commitTransaction();
        return {
            success: true,
            message: 'Inventory write-off completed successfully',
            journalEntry,
            updatedInventory: inventory
        };

    } catch (error) {
        await session.abortTransaction();
        throw new Error(`Write-off failed: ${error.message}`);
    } finally {
        session.endSession();
    }
}

// Express route handler
async function writeOffInventoryHandler(req, res) {
    try {
        const { itemId, dairyProductId, quantity, reason, owner, date } = req.body;
        console.log(req.body)
        const result = await createInventoryWriteOff({
            itemId,
            dairyProductId,
            quantity,
            reason,
            owner,
            date
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createInventoryWriteOff,
    writeOffInventoryHandler
};