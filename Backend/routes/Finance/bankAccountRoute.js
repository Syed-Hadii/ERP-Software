const express = require("express");
const { save, view, deleteBank, deleteMultipleBanks, update, getCashAndBankSummary, getBankLedger } = require("../../controllers/Finance/bankAccountController.js");
const bankRouter = express.Router();

bankRouter
    .post("/add", save)
    .get("/get", view)
    .get("/summary", getCashAndBankSummary)
    .get("/ledger/:id", getBankLedger)
    .delete("delete/:id", deleteBank)
    .delete("/delete-multiple", deleteMultipleBanks)
    .put("/update", update);

module.exports = bankRouter;