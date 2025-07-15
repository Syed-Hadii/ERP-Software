const StockConsume = require("../../models/Inventory/stockConsumeModel.js");
const Item = require("../../models/Inventory/itemModel.js");

const add = async (req, res) => {
  const { haariId, stockCon } = req.body;
  try {
    const stockCons = new StockConsume({
      haariId,
      stock: stockCon.map((data) => ({
        item_id: data.item_id,
        land_id: data.land_id,
        stock_con: data.stock_con,
        date: data.date,
      })),
    });
stockCon.forEach((data) => {
  itemStock(data.item_id, data.stock_con);
});
    await stockCons.save();

    res.json({ success: true, message: "Stock Concume added successfully." });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error adding Stock Concume." });
  }
};
const itemStock = async (item_id, stock_consume) => {
  try {
    let item = await Item.findOne({ _id: item_id });

    if (!item) {
      console.log("Item not found");
      return;
    }

    let itemQty = item.pkg_qty - stock_consume;

    await Item.updateOne({ _id: item_id }, { pkg_qty: itemQty });
  } catch (error) {
    console.error("Error updating item quantity:", error);
  }
};

const destory = async (req, res) => {
  const { haariId, Id } = req.body;
  try {
    await LandxHaari.updateOne({ haariId }, { $pull: { land: { _id: Id } } });
    res.json({ success: true, message: "LandxHaari deleted successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting LandxHaari." });
  }
};

const view = async (req, res) => {
  try {
    const landxHaariList = await LandxHaari.find()
      .populate({
        path: "haariId",
        select: "name",
      })
      .populate({
        path: "land.land_id",
        select: "name",
      });
    res.json({ success: true, data: landxHaariList });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching LandxHaari records." });
  }
};

module.exports = { add, destory, view  };
