const express = require('express');
const { markAttendance, getAttendanceTable, getAttendanceByRange } = require('../../controllers/HR/attendance');
const { protect } = require('../../middlewares/authMiddleware');

const attendanceRouter = express.Router();
attendanceRouter.use(protect);

// Route to mark or update attendance
attendanceRouter.post('/', markAttendance);

// Route to get attendance table for a specific date
attendanceRouter.get('/', getAttendanceTable);

// Route to get attendance for a specific employee by date range
attendanceRouter.get('/:employeeId', getAttendanceByRange);

module.exports = attendanceRouter;