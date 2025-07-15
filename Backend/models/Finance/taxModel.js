const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    rate: {
        type: Number,
        min: [0, "Tax rate cannot be negative"],
        required: true,
    },
    coa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartAccount',
        required: true,
    },
}, {
});

module.exports = mongoose.model('Tax', taxSchema);