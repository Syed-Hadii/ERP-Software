const express = require("express");
const {
  addFarmer,
  deleteFarmer,
  updateFarmer,
  getFarmer,
  deleteMultipleFarmers,
} = require("../../controllers/Agriculture/farmer.js");
// const { protect, admin } = require("../../middlewares/authMiddleware");
const farmerRouter = express.Router();
// Apply auth middleware to all farmer routes
// farmerRouter.use(protect, admin);

farmerRouter.post("/addfarmer", addFarmer);
farmerRouter.get("/getfarmer", getFarmer);
farmerRouter.put("/updatefarmer", updateFarmer);
farmerRouter.delete("/deletefarmer", deleteFarmer);
farmerRouter.delete("/deletefarmers", deleteMultipleFarmers);

module.exports = farmerRouter;
