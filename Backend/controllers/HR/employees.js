const Employee = require('../../models/HR/employees');
const Attendance = require('../../models/HR/attendance');
const Loan = require('../../models/HR/loan');
const Payroll = require('../../models/HR/payroll');
const Increment = require('../../models/HR/increment');

// Create employee
exports.createEmployee = async (req, res) => {
    try {
        const newEmp = await Employee.create(req.body);
        res.status(201).json({ success: true, data: newEmp });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json({ success: true, data: employees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get single employee
// controllers/hr/employeeController.js
exports.getEmployeeById = async (req, res) => {
    try {
        const employeeId = req.params.id;

        const [employee, attendance, loans, payrolls, increments] = await Promise.all([
            Employee.findById(employeeId),
            Attendance.find({ employee: employeeId }),
            Loan.find({ employee: employeeId }),
            Payroll.find({ employee: employeeId }),
            Increment.find({ employee: employeeId }),
        ]);

        if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

        res.json({
            success: true,
            data: {
                employee,
                attendance,
                loans,
                payrolls,
                increments
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};