const Notification = require('../../models/notificationModel');
const Purchase_Request = require('../../models/Inventory/PurchaseInvoice');
const Sales_Request = require('../../models/Cattle/dairySales');

const generatePurchaseInvoiceNotifications = async (req, res) => {
    try {
        const purchaseInvoices = await Purchase_Request.find({ status: 'pending' })
            .populate('requestedBy');

        let count = 0;
        for (const invoice of purchaseInvoices) {
            if (!invoice.requestedBy) {
                console.warn(`Skipping purchase invoice ${invoice._id}: Missing requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'purchase-invoice',
                entityId: invoice._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'purchase-invoice',
                    title: `New Purchase Invoice`,
                    message: `Purchase invoice for ${invoice.item} worth ${invoice.amount} is pending approval`,
                    domain: 'finance',
                    entityId: invoice._id,
                    entityModel: 'Purchase_Request',
                    dueDate: new Date(),
                    priority: 'high',
                    recipients: [invoice.requestedBy._id],
                    roles: ['Finance Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Purchase invoice notifications generated', count });
    } catch (error) {
        console.error('Error generating purchase invoice notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate purchase invoice notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateSalesInvoiceNotifications = async (req, res) => {
    try {
        const salesInvoices = await Sales_Request.find({ status: 'pending' })
            .populate('requestedBy');

        let count = 0;
        for (const invoice of salesInvoices) {
            if (!invoice.requestedBy) {
                console.warn(`Skipping sales invoice ${invoice._id}: Missing requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'sales-invoice',
                entityId: invoice._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'sales-invoice',
                    title: `New Sales Invoice`,
                    message: `Sales invoice for ${invoice.item} worth ${invoice.amount} is pending approval`,
                    domain: 'finance',
                    entityId: invoice._id,
                    entityModel: 'Sales_Request',
                    dueDate: new Date(),
                    priority: 'high',
                    recipients: [invoice.requestedBy._id],
                    roles: ['Finance Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Sales invoice notifications generated', count });
    } catch (error) {
        console.error('Error generating sales invoice notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sales invoice notifications',
            count: 0,
            fallback: true
        });
    }
};

const generatePurchaseApprovalNotifications = async (req, res) => {
    try {
        const purchases = await Purchase_Request.find({ status: { $ne: 'pending' } })
            .populate('requestedBy');

        let count = 0;
        for (const purchase of purchases) {
            if (!purchase.requestedBy) {
                console.warn(`Skipping purchase ${purchase._id}: Missing requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'purchase-approval',
                entityId: purchase._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'purchase-approval',
                    title: `Purchase Request ${purchase.status}`,
                    message: `Purchase of ${purchase.item} for ${purchase.amount} has been ${purchase.status.toLowerCase()}`,
                    domain: 'finance',
                    entityId: purchase._id,
                    entityModel: 'Purchase_Request',
                    dueDate: new Date(),
                    priority: 'medium',
                    recipients: [purchase.requestedBy._id],
                    roles: ['Finance Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Purchase approval notifications generated', count });
    } catch (error) {
        console.error('Error generating purchase approval notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate purchase approval notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateSalesApprovalNotifications = async (req, res) => {
    try {
        const sales = await Sales_Request.find({ status: { $ne: 'pending' } })
            .populate('requestedBy');

        let count = 0;
        for (const sale of sales) {
            if (!sale.requestedBy) {
                console.warn(`Skipping sale ${sale._id}: Missing requestedBy`);
                continue;
            }

            const existingNotification = await Notification.findOne({
                type: 'sales-approval',
                entityId: sale._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'sales-approval',
                    title: `Sales Request ${sale.status}`,
                    message: `Sale of ${sale.item} for ${sale.amount} has been ${sale.status.toLowerCase()}`,
                    domain: 'finance',
                    entityId: sale._id,
                    entityModel: 'Sales_Request',
                    dueDate: new Date(),
                    priority: 'medium',
                    recipients: [sale.requestedBy._id],
                    roles: ['Finance Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Sales approval notifications generated', count });
    } catch (error) {
        console.error('Error generating sales approval notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate sales approval notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateAllFinanceNotifications = async (req, res) => {
    try {
        let totalCount = 0;
        const fakeRes = {
            json: (data) => { totalCount += data.count || 0 },
            status: () => ({ json: () => { } })
        };

        await generatePurchaseInvoiceNotifications(req, fakeRes);
        await generateSalesInvoiceNotifications(req, fakeRes);
        await generatePurchaseApprovalNotifications(req, fakeRes);
        await generateSalesApprovalNotifications(req, fakeRes);

        res.json({
            success: true,
            message: 'All finance notifications generated',
            count: totalCount
        });
    } catch (error) {
        console.error('Error generating all finance notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate all finance notifications',
            count: 0,
            fallback: true
        });
    }
};

module.exports = {
    generatePurchaseInvoiceNotifications,
    generateSalesInvoiceNotifications,
    generatePurchaseApprovalNotifications,
    generateSalesApprovalNotifications,
    generateAllFinanceNotifications
};