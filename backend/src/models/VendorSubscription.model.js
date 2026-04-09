import mongoose from 'mongoose';

const vendorSubscriptionSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: true,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
            default: 'active',
            index: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        paymentDetails: {
            method: { type: String },
            transactionId: { type: String },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
            stripeSessionId: { type: String },
            confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
            confirmedAt: { type: Date },
            notes: { type: String },
        },
    },
    { timestamps: true }
);

vendorSubscriptionSchema.index({ vendorId: 1, status: 1, endDate: -1 });

const VendorSubscription = mongoose.model('VendorSubscription', vendorSubscriptionSchema);
export default VendorSubscription;
