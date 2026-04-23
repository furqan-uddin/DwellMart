import mongoose from 'mongoose';

const integrationAuditLogSchema = new mongoose.Schema(
    {
        requestId: { type: String, trim: true, index: true },
        action: { type: String, required: true, trim: true, index: true },
        success: { type: Boolean, required: true, index: true },
        statusCode: { type: Number, default: 200 },
        message: { type: String, trim: true },
        orderId: { type: String, trim: true, index: true },
        partnerStatus: { type: String, trim: true, index: true },
        clientId: { type: String, trim: true, index: true },
        partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationPartner', index: true },
        partnerName: { type: String, trim: true },
        requestMeta: {
            method: { type: String, trim: true },
            path: { type: String, trim: true },
            query: { type: mongoose.Schema.Types.Mixed },
            params: { type: mongoose.Schema.Types.Mixed },
            body: { type: mongoose.Schema.Types.Mixed },
            ip: { type: String, trim: true },
            userAgent: { type: String, trim: true },
            durationMs: { type: Number },
        },
        rawPayload: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

integrationAuditLogSchema.index({ createdAt: -1, action: 1 });
integrationAuditLogSchema.index({ clientId: 1, createdAt: -1 });
integrationAuditLogSchema.index({ orderId: 1, createdAt: -1 });

const IntegrationAuditLog = mongoose.model('IntegrationAuditLog', integrationAuditLogSchema);
export default IntegrationAuditLog;
