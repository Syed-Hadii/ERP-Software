const Attendance = require('../../models/HR/attendance');
const Employee = require('../../models/HR/employees');

exports.markAttendance = async (req, res) => {
    try {
        const { employeeId, date, status, note } = req.body;

        // Validate inputs
        if (!employeeId || !date || !status) {
            return res.status(400).json({ success: false, message: 'employeeId, date, and status are required' });
        }

        // Normalize date and get year/month
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        const year = normalizedDate.getFullYear();
        const month = normalizedDate.getMonth() + 1;

        // Get days in month
        const daysInMonth = new Date(year, month, 0).getDate();

        // Find or create monthly record
        let record = await Attendance.findOne({
            employee: employeeId,
            year: year,
            month: month
        });

        if (record) {
            // Update existing attendance entry or add new one
            const existingEntryIndex = record.attendance.findIndex(
                entry => new Date(entry.date).getDate() === normalizedDate.getDate()
            );

            if (existingEntryIndex > -1) {
                record.attendance[existingEntryIndex] = { date: normalizedDate, status, note };
            } else {
                record.attendance.push({ date: normalizedDate, status, note });
            }
        } else {
            // Create new monthly record
            record = new Attendance({
                employee: employeeId,
                year,
                month,
                daysInMonth,
                attendance: [{ date: normalizedDate, status, note }]
            });
        }

        await record.save();
        res.status(201).json({ success: true, message: 'Attendance recorded', data: record });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getAttendanceTable = async (req, res) => {
    try {
        const { date } = req.query;

        // Validate date
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date query parameter is required' });
        }

        const queryDate = new Date(date);
        if (isNaN(queryDate)) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
        queryDate.setHours(0, 0, 0, 0);

        // Fetch attendance for given date
        const attendanceList = await Attendance.find({ date: queryDate }).populate('employee');

        if (attendanceList.length > 0) {
            // Attendance already marked for that day, send joined data
            const populated = attendanceList.map((att) => ({
                _id: att._id,
                employeeId: att.employee._id,
                name: `${att.employee.firstName} ${att.employee.lastName}`,
                department: att.employee.department,
                designation: att.employee.designation,
                status: att.status,
                date: att.date,
            }));
            return res.json({ success: true, data: populated });
        }

        // No attendance exists for that day, return all active employees with status = null
        const employees = await Employee.find({ status: 'active' });
        const result = employees.map((emp) => ({
            employeeId: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
            designation: emp.designation,
            status: null,
            date: queryDate
        }));

        res.json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAttendanceByRange = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { from, to } = req.query;

        const filter = {
            employee: employeeId,
            date: {
                ...(from && { $gte: new Date(from) }),
                ...(to && { $lte: new Date(to) })
            }
        };

        const records = await Attendance.find(filter).populate('employee');
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMonthlyAttendance = async (req, res) => {
    try {
        const { employeeId, year, month } = req.query;

        const query = {};
        if (employeeId) query.employee = employeeId;
        if (year) query.year = parseInt(year);
        if (month) query.month = parseInt(month);

        const attendance = await Attendance.find(query)
            .populate('employee', 'firstName lastName department designation')
            .sort({ year: -1, month: -1 });

        res.json({ success: true, data: attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};