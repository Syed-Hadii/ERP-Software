const Loan = require('../../models/HR/loan');
const Employee = require('../../models/HR/employees');
const User = require('../../models/userModel');

exports.createLoan = async (req, res) => {
    try {
        const { type, employee, user, totalAmount, installmentAmount, totalInstallments, startDate } = req.body;

        // Validate inputs
        if (!type || !['Employee', 'User'].includes(type) || !totalAmount || !installmentAmount || !totalInstallments) {
            return res.status(400).json({ success: false, message: 'type, totalAmount, installmentAmount, and totalInstallments are required' });
        }
        if (type === 'Employee' && !employee) {
            return res.status(400).json({ success: false, message: 'employee is required for Employee type' });
        }
        if (type === 'User' && !user) {
            return res.status(400).json({ success: false, message: 'user is required for User type' });
        }
        if (totalAmount <= 0 || installmentAmount <= 0 || totalInstallments < 1) {
            return res.status(400).json({ success: false, message: 'Invalid amounts or installments' });
        }
        // Validate installmentAmount
        const expectedInstallment = totalAmount / totalInstallments;
        if (Math.abs(installmentAmount - expectedInstallment) > 0.01) {
            return res.status(400).json({ success: false, message: 'installmentAmount does not match totalAmount / totalInstallments' });
        }

        const loan = await Loan.create({ type, employee, user, totalAmount, installmentAmount, totalInstallments, startDate });
        res.status(201).json({ success: true, data: loan });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getLoans = async (req, res) => {
    try {
        const { employeeId, userId } = req.query;
        const filter = {};
        if (employeeId) filter.employee = employeeId;
        if (userId) filter.user = userId;
        const data = await Loan.find(filter).populate('employee').populate('user');
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateLoanPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, note } = req.body;

        // Validate inputs
        if (!amount) {
            return res.status(400).json({ success: false, message: 'amount is required' });
        }

        const loan = await Loan.findById(id);
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        if (amount !== loan.installmentAmount) {
            return res.status(400).json({ success: false, message: 'Payment amount must match installmentAmount' });
        }

        loan.installmentsPaid += 1;
        loan.paidHistory.push({
            amount,
            installmentNumber: loan.installmentsPaid,
            note,
            date: Date.now(),
        });

        if (loan.installmentsPaid >= loan.totalInstallments) {
            loan.isPaid = true;
        }

        await loan.save();
        res.json({ success: true, data: loan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await Loan.findById(id);
        if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

        await loan.deleteOne();
        res.json({ success: true, message: 'Loan deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};