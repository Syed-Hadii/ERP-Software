const express = require("express");
const {
    addCrop, deleteCrop, updateCrop, getCrop, addCropVariety, deleteCropVariety, updateCropVariety, getCropVariety, getCropVarietyByCrop
} = require("../../controllers/Agriculture/crop_variety.js");
const cropRouter = express.Router();
// const { protect, admin } = require("../../middlewares/authMiddleware");
// Apply auth middleware to all crop routes
// cropRouter.use(protect, admin);
// Crop
cropRouter.post("/addcrop", addCrop);
cropRouter.get("/getcrop", getCrop);
cropRouter.delete("/deletecrop", deleteCrop);
cropRouter.put("/updatecrop", updateCrop);
// Crop Varieties
cropRouter.post("/addcrop_variety", addCropVariety);
cropRouter.get("/getVariety", getCropVariety);
cropRouter.get("/getcrop_variety/:id", getCropVarietyByCrop);
cropRouter.delete("/deletecrop_variety", deleteCropVariety);
cropRouter.put("/updatecrop_variety", updateCropVariety);

module.exports = cropRouter;
