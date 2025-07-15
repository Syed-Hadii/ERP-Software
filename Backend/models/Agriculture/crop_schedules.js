const mongoose = require('mongoose');
const { Schema } = mongoose;

// ================== Irrigation Schedule ==================
const IrrigationScheduleSchema = new Schema({
    crop: { type: Schema.Types.ObjectId, ref: 'Crop_Sow', required: true },
    date: { type: Date, required: true },
    method: { type: String, required: true },
    quantity: { type: Number, required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    notes: { type: String, required: false }    
}, { timestamps: true });

// ================== Fertilization Schedule ==================
const FertilizationScheduleSchema = new Schema({
    crop: { type: Schema.Types.ObjectId, ref: 'Crop_Sow', required: true },
    date: { type: Date, required: true },
    fertilizer: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Number, required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    notes: { type: String, required: false }
}, { timestamps: true });

// ================== Pesticide Schedule ==================
const PesticideScheduleSchema = new Schema({
    crop: { type: Schema.Types.ObjectId, ref: 'Crop_Sow', required: true },
    date: { type: Date, required: true },
    pesticide: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Number, required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    notes: { type: String, required: false }
}, { timestamps: true });

// Exporting models
const IrrigationSchedule = mongoose.model('Irrigation_Schedule', IrrigationScheduleSchema);
const FertilizationSchedule = mongoose.model('Fertilization_Schedule', FertilizationScheduleSchema);
const PesticideSchedule = mongoose.model('Pesticide_Schedule', PesticideScheduleSchema);

module.exports = {
    IrrigationSchedule,
    FertilizationSchedule,
    PesticideSchedule
};
