const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: 'system',
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete'],
    },
    entity: {
        type: String,
        required: true,
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    changes: {
        type: Object,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

auditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);