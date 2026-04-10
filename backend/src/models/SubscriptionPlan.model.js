import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, trim: true, default: '' },
        features: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        price_inr: { type: Number, required: true, min: 0, default: 0 },
        price_usd: { type: Number, required: true, min: 0, default: 0 },
        interval: {
            type: String,
            enum: ['month', 'year'],
            required: true,
            default: 'month',
        },
        stripe_price_id: { type: String, trim: true, default: null },
        razorpay_plan_id: { type: String, trim: true, default: null },
        isMostPopular: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

subscriptionPlanSchema.virtual('featureHighlights').get(function featureHighlights() {
    if (Array.isArray(this.features)) {
        return this.features.map((value) => String(value).trim()).filter(Boolean);
    }

    const highlights = this.features?.highlights;
    if (Array.isArray(highlights)) {
        return highlights.map((value) => String(value).trim()).filter(Boolean);
    }

    return [];
});

subscriptionPlanSchema.virtual('price').get(function price() {
    return Number(this.price_usd || 0);
});

subscriptionPlanSchema.virtual('currency').get(function currency() {
    return 'USD';
});

subscriptionPlanSchema.virtual('durationDays').get(function durationDays() {
    return this.interval === 'year' ? 365 : 30;
});

subscriptionPlanSchema.virtual('isTrial').get(function isTrial() {
    return Number(this.price_inr || 0) === 0 && Number(this.price_usd || 0) === 0;
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
