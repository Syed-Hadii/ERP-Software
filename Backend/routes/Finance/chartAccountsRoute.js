const express = require("express");

const { createChartAccount,
    getAllAccounts,
    getCashAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
    getLedgerByCoaId } = require("../../controllers/Finance/chartAccountsController.js");

const chartAccountRouter = express.Router()

chartAccountRouter.post('/add', createChartAccount);
chartAccountRouter.get('/get', getAllAccounts);
chartAccountRouter.get('/get-cash', getCashAccounts);
chartAccountRouter.get('/get/:id', getAccountById);
chartAccountRouter.get('/ledger/:id', getLedgerByCoaId);
chartAccountRouter.put('/update/:id', updateAccount);
chartAccountRouter.delete('/delete/:id', deleteAccount);

module.exports = chartAccountRouter;