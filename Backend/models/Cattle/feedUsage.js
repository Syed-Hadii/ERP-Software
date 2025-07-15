const  mongoose  = require("mongoose");

const FeedUsageSchema = new mongoose.Schema({
    cattleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CattleRegister',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantityUsed: {
        type: Number,
        required: true, min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('FeedUsage', FeedUsageSchema);