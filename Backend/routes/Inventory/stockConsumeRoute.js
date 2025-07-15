const express = require("express");

const { add, destory, view } = require("../../controllers/Inventory/stockConsumeController.js");
const { protect } = require("../../middlewares/authMiddleware.js");
const stockConsumeRouter = express.Router();
// Apply auth middleware to all stock consume routes
stockConsumeRouter.use(protect);

stockConsumeRouter.post("/add", add).post("/delete", destory).get("/get", view);

module.exports = stockConsumeRouter;
