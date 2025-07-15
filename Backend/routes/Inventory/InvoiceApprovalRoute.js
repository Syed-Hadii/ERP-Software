const express = require("express");
const InvoiceApprovalRouter = express.Router();
const invoiceApprovalController = require("../../controllers/Inventory/invoicesApprovalController");

// Get all invoices (purchase and/or sales)
InvoiceApprovalRouter.get("/", invoiceApprovalController.getInvoices);

// Get a single invoice by ID and type
InvoiceApprovalRouter.get("/:type/:id", invoiceApprovalController.getInvoiceById);

// Approve an invoice
InvoiceApprovalRouter.post("/approve", invoiceApprovalController.approveInvoice);

// Reject an invoice
InvoiceApprovalRouter.post("/reject", invoiceApprovalController.rejectInvoice);

module.exports = InvoiceApprovalRouter;