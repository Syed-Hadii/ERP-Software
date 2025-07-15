const Notification = require('../../models/notificationModel');
const Inventory = require('../../models/Inventory/inventory');
const Inventory_Request = require('../../models/Inventory/inventoryRequest');

const generateLowStockNotifications = async (req, res) => {
    try {
        const lowStockItems = await Inventory.find().populate('item');
        let count = 0;

        for (const inventoryItem of lowStockItems) {
            const item = inventoryItem.item;
            if (!item || !item.lowStockThreshold) {
                console.warn(`Skipping inventory item ${inventoryItem._id}: Missing item or lowStockThreshold`);
                continue;
            }

            if (inventoryItem.quantity <= item.lowStockThreshold) {
                const roles = ['Inventory Manager'];
                if (inventoryItem.owner === 'agriculture') roles.push('Crop Manager');
                else if (inventoryItem.owner === 'cattle') roles.push('Dairy Manager');

                const existingNotification = await Notification.findOne({
                    type: 'inventory',
                    entityId: inventoryItem._id,
                    isRead: false
                });

                if (!existingNotification) {
                    const newNotification = new Notification({
                        type: 'inventory',
                        title: `Low Stock Alert: ${item.name || 'Unknown'}`,
                        message: `Current: ${inventoryItem.quantity}, Minimum: ${item.lowStockThreshold} ${item.unit || ''}`,
                        domain: 'inventory',
                        entityId: inventoryItem._id,
                        entityModel: 'Inventory',
                        dueDate: new Date(),
                        priority: inventoryItem.quantity <= (item.lowStockThreshold / 2) ? 'high' : 'medium',
                        roles,
                        inventoryDetails: {
                            currentQuantity: inventoryItem.quantity,
                            minThreshold: item.lowStockThreshold,
                            unit: item.unit || 'units'
                        }
                    });
                    await newNotification.save();
                    count++;
                }
            }
        }
        res.json({ success: true, message: 'Low stock notifications generated', count });
    } catch (error) {
        console.error('Error generating low stock notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate low stock notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateRequestNotifications = async (req, res) => {
    try {
        const requests = await Inventory_Request.find({ status: 'pending' }).populate('item requestedBy');
        let count = 0;

        for (const request of requests) {
            if (!request.item || !request.requestedBy) {
                console.warn(`Skipping request ${request._id}: Missing item or requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'inventory-request',
                entityId: request._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'inventory-request',
                    title: `Inventory Request: ${request.item.name || 'Unknown'}`,
                    message: `Requested ${request.quantity} ${request.item.unit || 'units'} by ${request.requestorType || 'Unknown'}`,
                    domain: 'inventory',
                    entityId: request._id,
                    entityModel: 'Inventory_Request',
                    dueDate: new Date(),
                    priority: 'medium',
                    roles: ['Inventory Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Request notifications generated', count });
    } catch (error) {
        console.error('Error generating inventory request notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate inventory request notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateInventoryRequestResponseNotifications = async (req, res) => {
    try {
        const requests = await Inventory_Request.find({ status: { $ne: 'pending' } }).populate('item requestedBy');
        let count = 0;

        for (const request of requests) {
            if (!request.item || !request.requestedBy) {
                console.warn(`Skipping request ${request._id}: Missing item or requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'inventory-request-response',
                entityId: request._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'inventory-request-response',
                    title: `Request ${request.status}: ${request.item.name || 'Unknown'}`,
                    message: `Your request for ${request.quantity} ${request.item.unit || 'units'} has been ${request.status.toLowerCase()}`,
                    domain: 'inventory',
                    entityId: request._id,
                    entityModel: 'Inventory_Request',
                    dueDate: new Date(),
                    priority: 'medium',
                    recipients: [request.requestedBy._id],
                    roles: [request.requestorType, 'Inventory Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Request response notifications generated', count });
    } catch (error) {
        console.error('Error generating inventory request response notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate inventory request response notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateAllInventoryNotifications = async (req, res) => {
    try {
        let totalCount = 0;
        const fakeRes = {
            json: (data) => { totalCount += data.count || 0 },
            status: () => ({ json: () => { } })
        };

        await generateLowStockNotifications(req, fakeRes);
        await generateRequestNotifications(req, fakeRes);
        await generateInventoryRequestResponseNotifications(req, fakeRes);

        res.json({
            success: true,
            message: 'All inventory notifications generated',
            count: totalCount
        });
    } catch (error) {
        console.error('Error generating all inventory notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate all inventory notifications',
            count: 0,
            fallback: true
        });
    }
};

module.exports = {
    generateLowStockNotifications,
    generateRequestNotifications,
    generateInventoryRequestResponseNotifications,
    generateAllInventoryNotifications
};