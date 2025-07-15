const express = require('express');
const dashboardRouter = express.Router();
const { getAdminDashboard } = require('../controllers/dashboardController');
// const authMiddleware = require('../middleware/auth'); // Assumed JWT middleware
// const adminMiddleware = (req, res, next) => {
//     if (req.user.role !== 'Admin') {
//         return res.status(403).json({ success: false, message: 'Admin access required' });
//     }
//     next();
// };

// Dashboard routes
dashboardRouter.get('/', getAdminDashboard);

module.exports = dashboardRouter;