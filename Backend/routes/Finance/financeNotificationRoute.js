const { Router } = require('express');
const financeNotificationRouter = Router();
const {
    generatePurchaseInvoiceNotifications,
    generateSalesInvoiceNotifications,
    generatePurchaseApprovalNotifications,
    generateSalesApprovalNotifications,
    generateAllFinanceNotifications
} = require('../../controllers/Finance/financeNotificationController');
const { protect, notificationAccess } = require('../../middlewares/authMiddleware');

// Apply auth middleware
financeNotificationRouter.use(protect, notificationAccess);

// Finance notification generation routes
financeNotificationRouter.post('/generate/purchase-invoices', generatePurchaseInvoiceNotifications);
financeNotificationRouter.post('/generate/sales-invoices', generateSalesInvoiceNotifications);
financeNotificationRouter.post('/generate/purchase-approvals', generatePurchaseApprovalNotifications);
financeNotificationRouter.post('/generate/sales-approvals', generateSalesApprovalNotifications);
financeNotificationRouter.post('/generate/all', generateAllFinanceNotifications);

module.exports = financeNotificationRouter;