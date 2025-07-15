const Increment = require('../../models/HR/increment');
const Employee = require('../../models/HR/employees');
const User = require('../../models/userModel');

exports.addIncrement = async (req, res) => {
    try {
        const { type, employee, user, amount, remarks, date } = req.body;

        // Validate inputs
        if (!type || !['Employee', 'User'].includes(type) || !amount) {
            return res.status(400).json({ success: false, message: 'type and amount are required, and type must be Employee or User' });
        }
        if (type === 'Employee' && !employee) {
            return res.status(400).json({ success: false, message: 'employee is required for Employee type' });
        }
        if (type === 'User' && !user) {
            return res.status(400).json({ success: false, message: 'user is required for User type' });
        }
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be positive' });
        }

        let entity;
        if (type === 'Employee') {
            entity = await Employee.findById(employee);
            if (!entity) return res.status(404).json({ success: false, message: 'Employee not found' });
        } else {
            entity = await User.findById(user).select('+basicSalary');
            if (!entity) return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update basicSalary
        entity.basicSalary = Number(entity.basicSalary || 0) + Number(amount);
        await entity.save();

        const inc = await Increment.create({ type, employee, user, amount, remarks, date: date || Date.now() });
        res.status(201).json({ success: true, data: inc });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getAllIncrements = async (req, res) => {
    try {
        const { employeeId, userId } = req.query;
        const filter = {};
        if (employeeId) filter.employee = employeeId;
        if (userId) filter.user = userId;
        const data = await Increment.find(filter).populate('employee').populate('user');
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getIncrementsByEntity = async (req, res) => {
    try {
        const { type, id } = req.params; // Expect type and id in URL (e.g., /increments/Employee/:id)
        if (!['Employee', 'User'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }
        const filter = type === 'Employee' ? { employee: id } : { user: id };
        const data = await Increment.find(filter).populate('employee').populate('user');
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateIncrement = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, remarks, date } = req.body;

        const inc = await Increment.findById(id);
        if (!inc) return res.status(404).json({ success: false, message: 'Increment not found' });

        let entity;
        if (inc.type === 'Employee') {
            entity = await Employee.findById(inc.employee);
            if (!entity) return res.status(404).json({ success: false, message: 'Employee not found' });
        } else {
            entity = await User.findById(inc.user).select('+basicSalary');
            if (!entity) return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Adjust basicSalary: subtract old amount, add new amount
        entity.basicSalary = Number(entity.basicSalary) - Number(inc.amount) + Number(amount || inc.amount);
        await entity.save();

        inc.amount = amount || inc.amount;
        inc.remarks = remarks !== undefined ? remarks : inc.remarks;
        inc.date = date || inc.date;
        await inc.save();

        res.json({ success: true, data: inc });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteIncrement = async (req, res) => {
    try {
        const { id } = req.params;
        const inc = await Increment.findById(id);
        if (!inc) return res.status(404).json({ success: false, message: 'Increment not found' });

        let entity;
        if (inc.type === 'Employee') {
            entity = await Employee.findById(inc.employee);
            if (!entity) return res.status(404).json({ success: false, message: 'Employee not found' });
        } else {
            entity = await User.findById(inc.user).select('+basicSalary');
            if (!entity) return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Reverse basicSalary update
        entity.basicSalary = Number(entity.basicSalary) - Number(inc.amount);
        await entity.save();

        await inc.deleteOne();
        res.json({ success: true, message: 'Increment deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};