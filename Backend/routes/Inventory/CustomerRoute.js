const express = require("express");

const { save, view, update, remove, } = require("../../controllers/Inventory/customerController.js");
const { protect } = require("../../middlewares/authMiddleware.js");
const customerRouter = express.Router();
// Apply auth middleware to all customer routes
// customerRouter.use(protect);

customerRouter.post("/add", save);
customerRouter.get("/get", view);
customerRouter.put("/update", update);
customerRouter.delete("/delete", remove);

module.exports = customerRouter;
