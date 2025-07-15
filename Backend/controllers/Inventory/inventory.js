const Inventory = require('../../models/Inventory/inventory');

// Generic view by owner
const viewByOwner = async (req, res, owner) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 7;
  const skip = (page - 1) * limit;
  const all = req.query.all === 'true';
  try {
    if (all) {
      const list = await Inventory.find({ owner }).populate('item');
      return res.json({ totalInventory: list.length, totalPages: 1, currentPage: 1, inventoryList: list });
    }
    const totalInventory = await Inventory.countDocuments({ owner });
    const list = await Inventory.find({ owner }).populate('item').skip(skip).limit(limit);
    return res.json({ totalInventory, totalPages: Math.ceil(totalInventory / limit), currentPage: page, inventoryList: list });
  } catch (error) {
    console.error(`Error fetching ${owner} inventory:`, error);
    return res.status(500).json({ success: false, message: `Error fetching ${owner} inventory.` });
  }
};

// View manager inventory
exports.viewManagerInventory = (req, res) => viewByOwner(req, res, 'manager');
// View agriculture inventory
exports.viewAgricultureInventory = (req, res) => viewByOwner(req, res, 'agriculture');
// View cattle inventory
exports.viewCattleInventory = (req, res) => viewByOwner(req, res, 'cattle');

// Update Inventory record
exports.updateInventory = async (req, res) => {
  try {
    const { id, quantity, totalCost, averageCost } = req.body;
    const updated = await Inventory.findByIdAndUpdate(
      id,
      { $set: { quantity, totalCost, averageCost } },
      { new: true }
    ).populate('item');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Inventory record not found.' });
    }
    return res.json({ success: true, message: 'Inventory record updated.', data: updated });
  } catch (error) {
    console.error('Error updating inventory record:', error);
    return res.status(500).json({ success: false, message: 'Error updating inventory record.' });
  }
};

// Delete inventory record
exports.destroyInventory = async (req, res) => {
  try {
    if (req.params.id) {
      await Inventory.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Inventory record deleted.' });
    }
    if (req.body.ids && Array.isArray(req.body.ids)) {
      await Inventory.deleteMany({ _id: { $in: req.body.ids } });
      return res.json({ success: true, message: `${req.body.ids.length} inventory records deleted.` });
    }
    if (req.body.id) {
      await Inventory.findByIdAndDelete(req.body.id);
      return res.json({ success: true, message: 'Inventory record deleted.' });
    }
    return res.status(400).json({ success: false, message: 'No valid ID provided for deletion.' });
  } catch (error) {
    console.error('Error deleting inventory record:', error);
    return res.status(500).json({ success: false, message: 'Error deleting inventory record.' });
  }
};