const express = require('express');
const payrollRequestRouter = express.Router();
const { createPayrollRequest, getPayrollRequests, processPayrollRequest } = require('../../controllers/HR/payrollRequest');
payrollRequestRouter.post('/request/create', createPayrollRequest); // HR role only
payrollRequestRouter.get('/request', getPayrollRequests); // Finance role only
payrollRequestRouter.post('/request/process', processPayrollRequest); // Finance role only

module.exports = payrollRequestRouter;