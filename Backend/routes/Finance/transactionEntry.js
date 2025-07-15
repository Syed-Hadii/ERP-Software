const express = require("express");
const { add, view, update, } = require("../../controllers/Finance/transactionEntry.js");

const transactionEntryRouter = express.Router();

transactionEntryRouter.post("/add", add);
transactionEntryRouter.get("/get", view);
transactionEntryRouter.put("/update", update);

module.exports = transactionEntryRouter;