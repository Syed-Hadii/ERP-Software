const express = require("express");
const { save, view, destroy, update } = require("../../controllers/Inventory/itemController.js");
const itemRoter = express.Router();
const { protect } = require("../../middlewares/authMiddleware");
// Apply auth middleware to all item routes
itemRoter.use(protect);

itemRoter
  .post("/save", save)
  .get("/view", view)
  .delete("/delete/:id", destroy)
  .put("/update", update);

module.exports = itemRoter;
