const express = require('express');
const { generatePayroll, getPayrolls, getPayrollPreview } = require('../../controllers/HR/payroll');
const { protect } = require('../../middlewares/authMiddleware');

const payrollRouter = express.Router();
payrollRouter.use(protect);

payrollRouter.post('/', generatePayroll);
payrollRouter.get('/', getPayrolls);
payrollRouter.get('/preview', getPayrollPreview);

module.exports = payrollRouter;