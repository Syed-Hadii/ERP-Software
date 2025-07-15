const express = require("express");
const { addLand, getLand, deleteLand, updateLand, deleteMultipleLands } = require("../../controllers/Agriculture/landController.js");
const landRouter = express.Router();
// const { protect, admin } = require("../../middlewares/authMiddleware");
// Apply auth middleware to all land routes
// landRouter.use(protect, admin);
// Land routes


landRouter.post("/", addLand)
landRouter.get("/", getLand);
landRouter.delete("/", deleteLand)
landRouter.delete("/delete", deleteMultipleLands)
landRouter.put("/", updateLand)

module.exports = landRouter;

