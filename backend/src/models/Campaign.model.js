import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, trim: true, unique: true, sparse: true },
        description: String,
        type: {
            type: String,
            enum: ['flash_sale', 'daily_deal', 'special_offer', 'festival', 'email', 'push', 'sms'],
            required: true
        },
        status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
        isActive: { type: Boolean, default: true },
        discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        discountValue: { type: Number, default: 0 },
        startDate: { type: Date },
        endDate: { type: Date },
        productIds: [{ type: mongoose.Schema.Types.Mixed }],
        route: { type: String, trim: true },
        autoCreateBanner: { type: Boolean, default: true },
        pageConfig: {
            showCountdown: { type: Boolean, default: true },
            countdownType: { type: String, default: 'campaign_end' },
            viewModes: [{ type: String }],
            defaultViewMode: { type: String, default: 'grid' },
            enableFilters: { type: Boolean, default: true },
            enableSorting: { type: Boolean, default: true },
            productsPerPage: { type: Number, default: 12 },
            showStats: { type: Boolean, default: true },
        },
        bannerConfig: {
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            image: { type: String, default: '' },
            customImage: { type: Boolean, default: false },
        },
        targetAudience: { type: String, enum: ['all', 'customers', 'vendors'], default: 'all' },
        content: String,
        scheduledAt: Date,
        sentAt: Date,
    },
    { timestamps: true }
);

campaignSchema.index({ isActive: 1, type: 1, createdAt: -1 });
campaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ slug: 1, isActive: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);
export { Campaign };
export default Campaign;
