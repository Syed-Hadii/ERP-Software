const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
    },
    trialBalance: {
        type: Object,
        default: {}
    },
    createdBy: {
        type: String,
        default: 'system'
    }
});

periodSchema.index({ endDate: -1 });

module.exports = mongoose.model('Period', periodSchema);