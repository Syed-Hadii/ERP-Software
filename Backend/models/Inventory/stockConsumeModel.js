const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
  haariId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Haari",
    required: true,
  },
  stock: [
    {
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      land_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Land",
        required: true,
      },
      stock_con: {
        type: Number,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
    },
  ],
});
const StockConsume = mongoose.model("Stock_consume", StockSchema);
module.exports = StockConsume;
