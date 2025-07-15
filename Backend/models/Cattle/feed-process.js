const mongoose = require('mongoose');

const FeedProcessSchema = new mongoose.Schema({
    inputProducts: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    outputProduct: {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',          // e.g., Buffalo Feed / Cow Feed
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
}, { timestamps: true });

module.exports = mongoose.model('FeedProcess', FeedProcessSchema);
