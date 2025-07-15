const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    seq: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    collection: 'counters',
    timestamps: false,
});

module.exports = mongoose.model('Counter', counterSchema);