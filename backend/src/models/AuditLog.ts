import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    target: { type: String, required: true }, // e.g. "User 123", "System Report"
    ipAddress: { type: String },
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
