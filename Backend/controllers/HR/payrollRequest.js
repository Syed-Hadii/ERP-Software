const Payroll = require('../../models/HR/payroll');
const PayrollRequest = require('../../models/HR/payrollRequest');
const mongoose = require('mongoose');

// Create a consolidated payroll request for finance
exports.createPayrollRequest = async (req, res) => {
    try {
        const { month, year } = req.body;

        // Validate inputs
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and year are required' });
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: 'Invalid month' });
        }
        if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: 'Invalid year' });
        }

        // Check if a request already exists for this month/year
        const existingRequest = await PayrollRequest.findOne({ month, year });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Payroll request already exists for this month and year' });
        }

        // Fetch all payrolls for the given month/year
        const payrolls = await Payroll.find({ month, year, financeRequest: null });
        if (!payrolls.length) {
            return res.status(404).json({ success: false, message: 'No payrolls found for this month and year' });
        }

        // Calculate total amount
        const totalAmount = payrolls.reduce((sum, payroll) => sum + payroll.netPay, 0);

        // Create payroll request
        const payrollRequest = await PayrollRequest.create({
            month,
            year,
            totalAmount,
            payrolls: payrolls.map(p => p._id),
        });

        // Update payrolls to link to this request
        await Payroll.updateMany(
            { _id: { $in: payrolls.map(p => p._id) } },
            { financeRequest: payrollRequest._id }
        );

        res.status(201).json({ success: true, data: payrollRequest });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get payroll requests (for finance team)
exports.getPayrollRequests = async (req, res) => {
    try {
        const { month, year, status } = req.query;
        const filter = {};
        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);
        if (status) filter.status = status;

        const requests = await PayrollRequest.find(filter)
            .populate('payrolls')
            .populate('payrolls.employee')
            .lean();

        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Process payroll request (approve/reject)
exports.processPayrollRequest = async (req, res) => {
    try {
        const { requestId, status, notes } = req.body;

        if (!requestId || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Request ID and valid status (Approved/Rejected) are required' });
        }

        const payrollRequest = await PayrollRequest.findById(requestId);
        if (!payrollRequest) {
            return res.status(404).json({ success: false, message: 'Payroll request not found' });
        }
        if (payrollRequest.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Request already processed' });
        }

        payrollRequest.status = status;
        payrollRequest.processedAt = new Date();
        payrollRequest.notes = notes || '';

        await payrollRequest.save();

        // Update linked payrolls
        await Payroll.updateMany(
            { financeRequest: requestId },
            { financeStatus: status }
        );

        // TODO: Add logic for finance payment entry (e.g., create a ledger entry for salary expense)
        // Example: await Ledger.create({ amount: payrollRequest.totalAmount, type: 'Salary Expense', ... });

        res.json({ success: true, data: payrollRequest });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};