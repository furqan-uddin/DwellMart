import mongoose from 'mongoose';

const billingWebhookEventSchema = new mongoose.Schema(
    {
        gateway: {
            type: String,
            enum: ['stripe', 'razorpay'],
            required: true,
            index: true,
        },
        eventId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        eventType: {
            type: String,
            required: true,
            trim: true,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        processedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const BillingWebhookEvent = mongoose.model('BillingWebhookEvent', billingWebhookEventSchema);

export default BillingWebhookEvent;
