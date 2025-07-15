const express = require('express');
const {getHRDashboard} = require('../../controllers/HR/employeeAnalytics');

const analyticRouter = express.Router();
 
// Route to get analytics for all employees
analyticRouter.get('/', getHRDashboard);

module.exports = analyticRouter;