import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'AED', trim: true },
        durationDays: { type: Number, required: true, min: 1 },
        description: { type: String, trim: true },
        features: [{ type: String, trim: true }],
        isTrial: { type: Boolean, default: false },
        isMostPopular: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
