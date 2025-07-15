const mongoose = require("mongoose");

const CattleRegisterSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    breed: {
        type: String,
        required: true
    },
    cattleId: {
        type: String,
        // required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    source: {
        type: String,
        enum: ['own farm', 'purchased', 'gifted'],
        required: true
    },
    purchaseDate: {
        type: Date,
        required: function () {
            return this.source === 'purchased';
        }
    },
    purchaseCost: {
        type: Number,
        required: function () {
            return this.source === 'purchased';
        }
    },
    weightAtArrival: {
        type: Number,
        required: true
    },
    healthStatus: {
        type: String,
        enum: ['good', 'fair', 'critical'],
        default: 'good'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});


const CattleRegister = mongoose.model("CattleRegister", CattleRegisterSchema);
module.exports = CattleRegister;
