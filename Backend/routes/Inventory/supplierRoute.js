const express = require("express");

const { save, view, update, remove } = require("../../controllers/Inventory/supplierController.js");
// const { protect } = require("../../middlewares/authMiddleware.js");
const supplierRouter = express.Router();
// Apply auth middleware to all supplier routes
// supplierRouter.use(protect);

supplierRouter.post("/add", save);
supplierRouter.get("/get", view);
supplierRouter.put("/update", update);
supplierRouter.delete("/delete", remove);

module.exports = supplierRouter;
