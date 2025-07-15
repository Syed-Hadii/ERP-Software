const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
    name: {
        type: String,
        requird: true,
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    nic: {
        type: String,
        required: true
    }

});
const Farmer = mongoose.model("Farmer", farmerSchema);
module.exports = Farmer;