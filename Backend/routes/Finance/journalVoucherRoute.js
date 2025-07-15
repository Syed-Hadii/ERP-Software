const express = require("express");
const { add, get, remove, update } = require("../../controllers/Finance/journalVoucherController.js");
const journalVoucherRouter = express.Router();

journalVoucherRouter
    .post("/add", add)
    .get("/get", get)
    .delete("/delete", remove)
    .put("/update", update);

module.exports = journalVoucherRouter;