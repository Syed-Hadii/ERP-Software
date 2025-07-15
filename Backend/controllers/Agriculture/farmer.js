const Farmer = require("../../models/Agriculture/farmer.js");

// Add a new Farmer
const addFarmer = async (req, res) => {
  const { name, address, phone, nic } = req.body;
  try {
    const newFarmer = new Farmer({
      name,
      address,
      phone,
      nic,
    });
    await newFarmer.save();
    res.json({ success: true, message: "Farmer added successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding Farmer." });
  }
};

// Delete a Farmer by ID
const deleteFarmer = async (req, res) => {
  try {
    const rezult = await Farmer.deleteOne({ _id: req.body.id })
    return res.json({ success: true, message: "Farmer is deleted" });
  } catch (error) {
    console.error("Error Deleting User:", error);
    res.json({ success: false, message: "Server error", error });
  }
};
const deleteMultipleFarmers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Field 'ids' is required and must be an array" });
    }
    const result = await Farmer.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} Farmer(s) deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update a Farmer by ID
const updateFarmer = async (req, res) => {
  try {
    const farmerId = req.body.id;
    const updatedData = req.body;
    const updatedFarmer = await Farmer.findByIdAndUpdate(farmerId, updatedData, { new: true });
    return res.json({ success: true, message: "User is Updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.json({ success: false, message: "Server error", error });
  }
};

// Get all Farmer records
const getFarmer = async (req, res) => {

  const fetchAll = req.query.all === "true";

  try {
    if (fetchAll) {
      const farmer = await Farmer.find({});
      return res.json({
        totalFarmer: farmer.length,
        farmer,
      });
    } else {
      // Pagination logic
      const page = parseInt(req.query.page) || 1;
      const limit = 7;
      const skip = (page - 1) * limit;

      const totalFarmer = await Farmer.countDocuments();
      const farmer = await Farmer.find({}).skip(skip).limit(limit);
      res.json({
        totalFarmer,
        totalPages: Math.ceil(totalFarmer / limit),
        currentPage: page,
        farmer,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

module.exports = { addFarmer, deleteFarmer, updateFarmer, getFarmer, deleteMultipleFarmers };
