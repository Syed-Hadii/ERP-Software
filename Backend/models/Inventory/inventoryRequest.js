const mongoose = require('mongoose');

const InventoryRequestSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    }, 
    requestorType: {
        type: String,
        enum: ['Crop Manager', 'Dairy Manager'],
        required: true
    },
    quantityRequested: {
        type: Number,
        required: true,
        min: 1
    },
    details: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    handledAt: { type: Date },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

InventoryRequestSchema.index({ item: 1, status: 1 });
InventoryRequestSchema.index({ requestorType: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryRequest', InventoryRequestSchema);