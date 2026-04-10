import mongoose from 'mongoose';

const onboardingPlanSelectionSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: true,
            index: true,
        },
        country: {
            type: String,
            trim: true,
            default: '',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

const OnboardingPlanSelection = mongoose.model('OnboardingPlanSelection', onboardingPlanSelectionSchema);

export default OnboardingPlanSelection;
