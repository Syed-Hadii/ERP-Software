const mongoose = require("mongoose");

const ExitEventSchema = new mongoose.Schema({
    cattleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CattleRegister',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    exitType: {
        type: String,
        enum: ['Sale', 'Death', 'Transfer'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    salePrice: {
        type: Number,
        required: function () {
            return this.exitType === 'Sale';
        }
    },
    newOwnerDestination: {
        type: String,
        required: function () {
            return ['Sale', 'Transfer'].includes(this.exitType);
        }
    }
}, {
    timestamps: true
});

// Pre-save hook to update cattle status
ExitEventSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Cattle = mongoose.model('CattleRegister');
        await Cattle.findByIdAndUpdate(this.cattleId, { status: 'inactive' });
    }
    next();
});

const ExitEvent = mongoose.model("ExitEvent", ExitEventSchema);
module.exports = ExitEvent;