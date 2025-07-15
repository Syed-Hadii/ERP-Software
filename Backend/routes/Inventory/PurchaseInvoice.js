const express = require("express");
const purchaseInvoiceRouter = express.Router();
const { save, view } = require('../../controllers/Inventory/PurchaseInvoice');
// const { protect } = require('../../middlewares/authMiddleware');

// purchaseInvoiceRouter.use(protect);
purchaseInvoiceRouter.post("/", save);
purchaseInvoiceRouter.get("/", view);

module.exports = purchaseInvoiceRouter;