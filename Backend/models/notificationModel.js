const mongoose = require("mongoose");
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    type: {
        type: String,
        enum: [
            'harvest', 'schedule', 'inventory', 'cattle-health', 'cattle-breeding', 'cattle-milking',
            'inventory-request', 'inventory-request-response', 'purchase-approval', 'sales-approval',
            'payroll-request', 'payroll-approval', 'finance-notification'
        ],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    domain: { type: String, enum: ['agriculture', 'cattle', 'inventory', 'hr', 'finance'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityModel: { type: String, required: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    roles: [{ type: String, enum: ['Crop Manager', 'Finance Manager', 'Admin', 'Dairy Manager', 'HR Manager', 'Inventory Manager'] }],
    inventoryDetails: {
        currentQuantity: Number,
        minThreshold: Number,
        unit: String
    },
    scheduleDetails: {
        scheduleType: { type: String, enum: ['irrigation', 'fertilization', 'pesticide', 'vaccination', 'checkup', 'feed'] },
        quantity: String
    },
    harvestDetails: {
        expectedYield: String,
        daysUntilHarvest: Number
    }
}, { timestamps: true });

NotificationSchema.index({ isRead: 1, domain: 1, type: 1 });
NotificationSchema.index({ dueDate: 1 });
NotificationSchema.index({ entityId: 1 });
NotificationSchema.index({ recipients: 1 });
NotificationSchema.index({ roles: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;