import mongoose from 'mongoose';
import crypto from 'crypto';

const ALLOWED_SCOPES = [
    'orders:read',
    'orders:write',
    'inventory:write',
];

const integrationPartnerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        clientId: { type: String, required: true, unique: true, trim: true, index: true },
        apiKeyHash: { type: String, required: true, select: false },
        isActive: { type: Boolean, default: true, index: true },
        allowedScopes: {
            type: [{ type: String, enum: ALLOWED_SCOPES }],
            default: ALLOWED_SCOPES,
        },
        // Designed so strict IP controls can be turned on per partner later.
        allowedIpAddresses: {
            type: [{ type: String, trim: true }],
            default: [],
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        lastUsedAt: { type: Date },
    },
    { timestamps: true }
);

integrationPartnerSchema.index({ clientId: 1, isActive: 1 });

integrationPartnerSchema.methods.verifyApiKey = function verifyApiKey(rawApiKey = '') {
    const incomingHash = crypto.createHash('sha256').update(String(rawApiKey)).digest('hex');
    const storedHash = String(this.apiKeyHash || '');
    if (!storedHash || storedHash.length !== incomingHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(incomingHash));
};

const IntegrationPartner = mongoose.model('IntegrationPartner', integrationPartnerSchema);

export { ALLOWED_SCOPES };
export default IntegrationPartner;
