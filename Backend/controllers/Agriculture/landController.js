const Land = require("../../models/Agriculture/landModel.js");
const CropAssign = require("../../models/Agriculture/crop-sow.js");

const getLand = async (req, res) => {
  const fetchAll = req.query.all === "true";

  try {
    // Get all lands that are currently assigned to crops
    const assignedLands = await CropAssign.find({ cropStatus: { $ne: 'Harvested' } }).distinct('land');

    if (fetchAll) {
      // Find all lands and add isAssigned flag
      const land = await Land.find({});
      const landWithStatus = land.map(l => ({
        ...l.toObject(),
        isAssigned: assignedLands.some(id => id.equals(l._id))
      }));

      return res.json({
        totalLands: landWithStatus.length,
        land: landWithStatus,
      });
    } else {
      // Pagination logic
      const page = parseInt(req.query.page) || 1;
      const limit = 7;
      const skip = (page - 1) * limit;

      const totalLands = await Land.countDocuments();
      const land = await Land.find({}).skip(skip).limit(limit);
      
      // Add isAssigned flag to paginated results
      const landWithStatus = land.map(l => ({
        ...l.toObject(),
        isAssigned: assignedLands.some(id => id.equals(l._id))
      }));

      res.json({
        totalLands,
        totalPages: Math.ceil(totalLands / limit),
        currentPage: page,
        land: landWithStatus,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching lands" });
  }
};

const addLand = async (req, res) => {
  const { name, area, size, location } = req.body;
  try {
    const AddLand = new Land({
      name,
      area,
      size,
      location,
    });
    const $land = await AddLand.save();
    res.json({ success: true, message: "Land Inseted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateLand = async (req, res) => {
  const { id, name, area, size, location } = req.body;
  try {
    const updatedData = {
      name,
      area,
      size,
      location,
    };
    const land = await Land.findByIdAndUpdate(id, updatedData, { new: true });
    return res.json({
      success: true,
      message: "Land is updated successfully",
      data: land,
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Error updating Land." });
  }
};

const deleteLand = async (req, res) => {
  try {
    const data = await Land.deleteOne({ _id: req.body.id });
    res.json({ success: true, message: "Land deleted successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting Land." });
  }
};
const deleteMultipleLands = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Field 'ids' is required and must be an array" });
    }
    const result = await Land.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} Land(s) deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { addLand, getLand, updateLand, deleteLand, deleteMultipleLands };
