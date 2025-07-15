const Crop_Sow = require("../../models/Agriculture/crop-sow.js");
const Inventory = require("../../models/Inventory/inventory.js");
const AgroInventory = require("../../models/Agriculture/agroInventory.js");
const Crop_Variety = require("../../models/Agriculture/crop_variety.js");
const Land = require("../../models/Agriculture/landModel.js");
const Farmer = require("../../models/Agriculture/farmer.js");

// Add new Crop Assignment
const addCropSow = async (req, res) => {
  const {
    crop,
    variety,
    farmer,
    land,
    seed,
    quantity,
    seedSowingDate,
    expectedHarvestDate,
    cropStatus,
    yieldEstimate,
    notes,
  } = req.body;

  try {
    // Validate required fields
    if (!seed || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Seed and quantity are required.",
      });
    }
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // Check if land is already assigned
    const existingAssignment = await Crop_Sow.findOne({
      land,
      cropStatus: { $ne: "Harvested" },
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "This land is already assigned to another crop.",
      });
    }

    // Check inventory for seed availability
    const inventory = await Inventory.findOne({
      item: seed,
      owner: "agriculture",
    }).populate("item");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Seed not found in inventory.",
      });
    }
    if (inventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient seed quantity in inventory. Available: ${inventory.quantity} ${inventory.unit}.`,
      });
    }

    // Deduct quantity from inventory
    inventory.quantity -= quantity;
    await inventory.save();

    const seedCost = quantity * inventory.averageCost;
    // Create new crop sow record
    const newAssignment = new Crop_Sow({
      crop,
      variety,
      farmer,
      land,
      seed,
      quantity,
      seedSowingDate,
      expectedHarvestDate,
      cropStatus,
      yieldEstimate,
      notes,
      incurredCosts: seedCost,
    });

    await newAssignment.save();

    res.json({ success: true, message: "Crop assignment added successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding crop assignment." });
  }
};

// Delete a Crop Assignment
const deleteCropSow = async (req, res) => {
  const id = req.params.id || req.body.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "Crop assignment ID is required." });
  }

  try {
    const cropSow = await Crop_Sow.findById(id);
    if (!cropSow) {
      return res.status(404).json({ success: false, message: "Crop assignment not found." });
    }

    // Restore inventory quantity
    const inventory = await Inventory.findOne({
      item: cropSow.seed,
      owner: "agriculture",
    });
    if (inventory) {
      inventory.quantity += cropSow.quantity;
      await inventory.save();
    }

    await cropSow.deleteOne();
    res.json({ success: true, message: "Crop assignment deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting crop assignment." });
  }
};

// Get Crop Assignments (All or Paginated)
const getCropSow = async (req, res) => {
  const fetchAll = req.query.all === "true";

  try {
    if (fetchAll) {
      const cropList = await Crop_Sow.find()
        .populate("farmer")
        .populate("land")
        .populate("crop")
        .populate("variety")
        .populate("seed");

      return res.json({
        totalRecord: cropList.length,
        cropList,
      });
    } else {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 7;
      const skip = (page - 1) * limit;

      const totalRecord = await Crop_Sow.countDocuments();
      const cropList = await Crop_Sow.find()
        .skip(skip)
        .limit(limit)
        .populate("farmer", "name")
        .populate("land", "name")
        .populate("crop", "name")
        .populate("variety")
        .populate("seed");

      res.json({
        totalRecord,
        totalPages: Math.ceil(totalRecord / limit),
        currentPage: page,
        cropList,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching crop assignments." });
  }
};

// Get a single crop assignment by ID
const getCropSowById = async (req, res) => {
  const { id } = req.params;

  try {
    const crop = await Crop_Sow.findById(id)
      .populate("farmer")
      .populate("land")
      .populate("crop")
      .populate("variety")
      .populate("seed");

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop assignment not found." });
    }

    res.json(crop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching crop assignment." });
  }
};

const updateCropSow = async (req, res) => {
  const {
    crop,
    variety,
    farmer,
    land,
    seed,
    quantity,
    seedSowingDate,
    expectedHarvestDate,
    cropStatus,
    yieldEstimate,
    notes,
    actualYieldQuantity,
    actualYieldUnit,
    fairValuePerUnit
  } = req.body;

  try {
    const existing = await Crop_Sow.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Crop assignment not found." });
    }

    // Check land conflict if updated
    if (land && land !== existing.land.toString()) {
      const conflict = await Crop_Sow.findOne({
        _id: { $ne: req.params.id },
        land,
        cropStatus: { $ne: "Harvested" },
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "This land is already assigned to another crop.",
        });
      }
    }

    // Handle inventory if seed or quantity changes
    if (seed || quantity !== undefined) {
      const newSeed = seed || existing.seed;
      const newQuantity = quantity !== undefined ? quantity : existing.quantity;

      if (newQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0.",
        });
      }

      const inventory = await Inventory.findOne({
        item: newSeed,
        owner: "agriculture",
      }).populate("item");
      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Seed not found in inventory.",
        });
      }

      const quantityDiff = newQuantity - existing.quantity;
      if (inventory.quantity < quantityDiff) {
        return res.status(400).json({
          success: false,
          message: `Insufficient seed quantity in inventory. Available: ${inventory.quantity} ${inventory.unit}.`,
        });
      }

      inventory.quantity -= quantityDiff;
      await inventory.save();

      if (seed && seed !== existing.seed.toString()) {
        const oldInventory = await Inventory.findOne({
          item: existing.seed,
          owner: "agriculture",
        });
        if (oldInventory) {
          oldInventory.quantity += existing.quantity;
          await oldInventory.save();
        }
      }
    }

    // Update fields
    existing.crop = crop ?? existing.crop;
    existing.variety = variety ?? existing.variety;
    existing.farmer = farmer ?? existing.farmer;
    existing.land = land ?? existing.land;
    existing.seed = seed ?? existing.seed;
    existing.quantity = quantity !== undefined ? quantity : existing.quantity;
    existing.seedSowingDate = seedSowingDate ?? existing.seedSowingDate;
    existing.expectedHarvestDate = expectedHarvestDate ?? existing.expectedHarvestDate;
    existing.cropStatus = cropStatus ?? existing.cropStatus;
    existing.yieldEstimate = yieldEstimate ?? existing.yieldEstimate;
    existing.notes = notes ?? existing.notes;

    // Handle harvest logic
    if (cropStatus === "Harvested" && existing.cropStatus !== "Harvested") {
      if (!actualYieldQuantity || !actualYieldUnit || !fairValuePerUnit) {
        return res.status(400).json({
          success: false,
          message: "Actual yield quantity, unit, and fair value per unit are required when harvesting."
        });
      }
      const totalCost = existing.incurredCosts;
      const averageCost = totalCost / actualYieldQuantity;

      const totalValue = actualYieldQuantity * fairValuePerUnit;

      // Update AgroInventory
      let agroInventory = await AgroInventory.findOne({ cropVariety: existing.variety });
      if (!agroInventory) {
        agroInventory = new AgroInventory({
          cropVariety: existing.variety,
          quantity: actualYieldQuantity,
          averageCost,
          totalCost,
        });
      } else {
        const newQuantity = agroInventory.quantity + actualYieldQuantity;
        const newTotalCost = agroInventory.totalCost + totalCost;
        agroInventory.quantity = newQuantity;
        agroInventory.averageCost = newTotalCost / newQuantity;
        agroInventory.totalCost = newTotalCost;
      }
      await agroInventory.save();

      // Store actual yield details
      existing.actualYieldQuantity = actualYieldQuantity;
      existing.actualYieldUnit = actualYieldUnit;
    }

    await existing.save();
    res.json({ success: true, message: "Crop assignment updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating crop assignment." });
  }
};

module.exports = {
  addCropSow,
  deleteCropSow,
  getCropSow,
  getCropSowById,
  updateCropSow,
};