const express = require("express");
const { add, view, update, remove } = require("../../controllers/Finance/transactionEntry.js");

const transactionEntryRouter = express.Router();

transactionEntryRouter.post("/add", add);
transactionEntryRouter.get("/get", view);
transactionEntryRouter.put("/update", update);
transactionEntryRouter.delete("/delete/:id", remove);

module.exports = transactionEntryRouter;