const { Router } = require('express');
const hrNotificationRouter = Router();
const {
    generatePayrollRequestNotifications,
    generatePayrollApprovalNotifications,
    generateAllHRNotifications
} = require('../../controllers/HR/hrNotificationController');
const { protect, notificationAccess } = require('../../middlewares/authMiddleware');

// Apply auth middleware
hrNotificationRouter.use(protect, notificationAccess);

// HR notification generation routes
hrNotificationRouter.post('/generate/payroll-requests', generatePayrollRequestNotifications);
hrNotificationRouter.post('/generate/payroll-approvals', generatePayrollApprovalNotifications);
hrNotificationRouter.post('/generate/all', generateAllHRNotifications);

module.exports = hrNotificationRouter;