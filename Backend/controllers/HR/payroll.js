const Payroll = require('../../models/HR/payroll');
const Attendance = require('../../models/HR/attendance');
const Employee = require('../../models/HR/employees');
const Loan = require('../../models/HR/loan');
const User = require('../../models/userModel');

exports.generatePayroll = async (req, res) => {
    try {
        const {
            type, employee, user, month, year, absenceDeduction, bonuses, loanDeduction,
            totalWorkingDays, daysInMonth, presentDays, leaveDays, absentDays, basicSalary,
        } = req.body;
        console.log(req.body)

        // Validate inputs
        if (!type || !month || !year || !['Employee', 'User'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type, month, and year are required, and type must be Employee or User' });
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: 'Invalid month' });
        }
        if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: 'Invalid year' });
        }

        let payrollData = { type, month, year, absenceDeduction, bonuses, loanDeduction, basicSalary };

        if (type === 'Employee') {
            // Employee-specific validations
            if (!employee || totalWorkingDays === undefined || daysInMonth === undefined) {
                return res.status(400).json({ success: false, message: 'Employee, totalWorkingDays, and daysInMonth are required for Employee type' });
            }
            if (presentDays + leaveDays + absentDays > daysInMonth) {
                return res.status(400).json({ success: false, message: 'Total days exceed days in month' });
            }

            const employeeData = await Employee.findById(employee);
            if (!employeeData) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            const activeLoan = await Loan.findOne({ employee, isPaid: false });
            const expectedLoanDeduction = activeLoan ? activeLoan.installmentAmount : 0;
            if (loanDeduction !== expectedLoanDeduction) {
                return res.status(400).json({ success: false, message: 'Invalid loan deduction' });
            }

            payrollData = {
                ...payrollData,
                employee,
                daysInMonth,
                totalWorkingDays,
                presentDays,
                leaveDays,
                absentDays,
                basicSalary: employeeData.basicSalary,
            };
        } else {
            // User-specific validations
            if (!user) {
                return res.status(400).json({ success: false, message: 'User is required for User type' });
            }

            const userData = await User.findById(user).select('+basicSalary');
            if (!userData) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // No loan support for users (assuming based on existing logic; can extend if needed)
            if (loanDeduction > 0) {
                return res.status(400).json({ success: false, message: 'Loan deduction not supported for users' });
            }

            payrollData = {
                ...payrollData,
                user,
                basicSalary: userData.basicSalary,
            };
        }

        // Calculate netPay
        payrollData.netPay = Number(payrollData.basicSalary) - Number(absenceDeduction || 0) - Number(loanDeduction || 0) + Number(bonuses || 0);
        if (payrollData.netPay < 0) {
            return res.status(400).json({ success: false, message: 'Net pay cannot be negative' });
        }

        const payroll = await Payroll.create(payrollData);

        // Update loan for employees
        if (type === 'Employee' && loanDeduction > 0) {
            const activeLoan = await Loan.findOne({ employee, isPaid: false });
            if (activeLoan) {
                activeLoan.installmentsPaid += 1;
                activeLoan.paidHistory.push({
                    amount: loanDeduction,
                    installmentNumber: activeLoan.installmentsPaid,
                    date: new Date(),
                    note: `Payroll deduction for ${year}-${month}`,
                });
                if (activeLoan.installmentsPaid >= activeLoan.totalInstallments) {
                    activeLoan.isPaid = true;
                }
                await activeLoan.save();
            }
        }

        res.status(201).json({ success: true, data: payroll });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPayrolls = async (req, res) => {
    try {
        const { employeeId, userId, month, year } = req.query;
        const filter = {};
        if (employeeId) filter.employee = employeeId;
        if (userId) filter.user = userId;
        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);

        const payrolls = await Payroll.find(filter).populate('employee').populate('user').lean();
        res.json({ success: true, data: payrolls });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPayrollPreview = async (req, res) => {
    try {
        const { type, employee, user, month, year } = req.query;

        // Validate inputs
        if (!type || !month || !year || !['Employee', 'User'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type, month, and year are required, and type must be Employee or User' });
        }
        if (!Number.isInteger(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12) {
            return res.status(400).json({ success: false, message: 'Invalid month' });
        }
        if (!Number.isInteger(parseInt(year)) || parseInt(year) < 2000 || parseInt(year) > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: 'Invalid year' });
        }

        let previewData = { month: parseInt(month), year: parseInt(year) };

        if (type === 'Employee') {
            if (!employee) {
                return res.status(400).json({ success: false, message: 'Employee is required for Employee type' });
            }

            const employeeData = await Employee.findById(employee);
            if (!employeeData) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            const start = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
            const end = new Date(start);
            end.setMonth(start.getMonth() + 1);

            const daysInMonth = new Date(year, parseInt(month), 0).getDate();
            const totalWorkingDays = Array.from(
                { length: daysInMonth },
                (_, i) => new Date(year, parseInt(month) - 1, i + 1)
            ).filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;

            const attendance = await Attendance.find({
                employee,
                date: { $gte: start, $lt: end },
            });

            const presentDays = attendance.filter(a => a.status === 'Present').length;
            const leaveDays = attendance.filter(a => a.status === 'Leave').length;
            const absentDays = attendance.filter(a => a.status === 'Absent').length;

            const perDaySalary = employeeData.basicSalary / daysInMonth;
            const absenceDeduction = perDaySalary * absentDays;

            const activeLoan = await Loan.findOne({ employee, isPaid: false });
            const loanDeduction = activeLoan ? activeLoan.installmentAmount : 0;

            previewData = {
                ...previewData,
                employee: {
                    _id: employeeData._id,
                    name: `${employeeData.firstName} ${employeeData.lastName}`,
                    department: employeeData.department,
                    designation: employeeData.designation,
                },
                daysInMonth,
                totalWorkingDays,
                presentDays,
                leaveDays,
                absentDays,
                basicSalary: employeeData.basicSalary,
                absenceDeduction,
                loanDeduction,
                bonuses: 0,
                netPay: employeeData.basicSalary - absenceDeduction - loanDeduction,
            };
        } else {
            if (!user) {
                return res.status(400).json({ success: false, message: 'User is required for User type' });
            }

            const userData = await User.findById(user).select('+basicSalary');
            if (!userData) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            previewData = {
                ...previewData,
                user: {
                    _id: userData._id,
                    name: userData.name,
                    role: userData.role,
                },
                basicSalary: userData.basicSalary,
                absenceDeduction: 0,
                loanDeduction: 0,
                bonuses: 0,
                netPay: userData.basicSalary,
            };
        }

        res.json({ success: true, data: previewData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};