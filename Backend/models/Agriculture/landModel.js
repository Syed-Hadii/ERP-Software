const mongoose = require("mongoose");

const LandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

const Land = mongoose.model("Land", LandSchema);
module.exports = Land;
