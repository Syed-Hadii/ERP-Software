const Notification = require('../../models/notificationModel');
const Payroll_Request = require('../../models/HR/payrollRequest');

const generatePayrollRequestNotifications = async (req, res) => {
    try {
        const payrollRequests = await Payroll_Request.find({ status: 'pending' }) 

        let count = 0;
        for (const request of payrollRequests) {
           

            const existingNotification = await Notification.findOne({
                type: 'payroll-request',
                entityId: request._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'payroll-request',
                    title: `New Payroll Request`,
                    message: `Payroll request of ${request.amount} submitted by HR`,
                    domain: 'hr',
                    entityId: request._id,
                    entityModel: 'Payroll_Request',
                    dueDate: new Date(),
                    priority: 'high',
                    recipients: 'HR',
                    roles: ['HR Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Payroll request notifications generated', count });
    } catch (error) {
        console.error('Error generating payroll request notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payroll request notifications',
            count: 0,
            fallback: true
        });
    }
};

const generatePayrollApprovalNotifications = async (req, res) => {
    try {
        const payrollRequests = await Payroll_Request.find({ status: { $ne: 'pending' } }) 

        let count = 0;
        for (const request of payrollRequests) {
           

            const existingNotification = await Notification.findOne({
                type: 'payroll-approval',
                entityId: request._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'payroll-approval',
                    title: `Payroll Request ${request.status}`,
                    message: `Your payroll request of ${request.amount} has been ${request.status.toLowerCase()}`,
                    domain: 'hr',
                    entityId: request._id,
                    entityModel: 'Payroll_Request',
                    dueDate: new Date(),
                    priority: 'medium',
                    recipients: 'HR',
                    roles: ['HR Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Payroll approval notifications generated', count });
    } catch (error) {
        console.error('Error generating payroll approval notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payroll approval notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateAllHRNotifications = async (req, res) => {
    try {
        let totalCount = 0;
        const fakeRes = {
            json: (data) => { totalCount += data.count || 0 },
            status: () => ({ json: () => { } })
        };

        await generatePayrollRequestNotifications(req, fakeRes);
        await generatePayrollApprovalNotifications(req, fakeRes);

        res.json({
            success: true,
            message: 'All HR notifications generated',
            count: totalCount
        });
    } catch (error) {
        console.error('Error generating all HR notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate all HR notifications',
            count: 0,
            fallback: true
        });
    }
};

module.exports = {
    generatePayrollRequestNotifications,
    generatePayrollApprovalNotifications,
    generateAllHRNotifications
};