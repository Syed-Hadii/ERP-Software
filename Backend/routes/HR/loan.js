const express = require('express');
const { createLoan, getLoans, updateLoanPayment, deleteLoan } = require('../../controllers/HR/loan');
const { protect } = require('../../middlewares/authMiddleware');

const loanRouter = express.Router();
loanRouter.use(protect);

loanRouter.post('/', createLoan);
loanRouter.get('/', getLoans);
loanRouter.put('/:id', updateLoanPayment);
loanRouter.delete('/:id', deleteLoan);

module.exports = loanRouter;