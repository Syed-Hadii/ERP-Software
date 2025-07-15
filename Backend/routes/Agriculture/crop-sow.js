const express = require("express");

const {
  addCropSow,
  deleteCropSow,
  getCropSow,
  getCropSowById,
  updateCropSow
} = require("../../controllers/Agriculture/crop-sow");
// const { protect, admin } = require("../../middlewares/authMiddleware");
// Apply auth middleware to all crop sow routes

const cropSowRouter = express.Router();
// cropSowRouter.use(protect, admin);

cropSowRouter.post("/", addCropSow);
cropSowRouter.put("/:id", updateCropSow);
cropSowRouter.get("/", getCropSow);
cropSowRouter.get("/:id", getCropSowById);
cropSowRouter.delete("/:id", deleteCropSow);

module.exports = cropSowRouter;