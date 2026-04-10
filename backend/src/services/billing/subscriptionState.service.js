import ApiError from '../../utils/ApiError.js';
import Payment from '../../models/Payment.model.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.model.js';
import Vendor from '../../models/Vendor.model.js';
import VendorSubscription from '../../models/VendorSubscription.model.js';
import { addPlanIntervalToDate, serializePlan } from './plan.service.js';

const STATUS_PRIORITY = {
    active: 4,
    past_due: 3,
    trialing: 2,
    incomplete: 1,
    canceled: 0,
};

export const mapStripeSubscriptionStatus = (status = '') => {
    switch (status) {
        case 'active':
            return 'active';
        case 'trialing':
            return 'trialing';
        case 'past_due':
        case 'unpaid':
            return 'past_due';
        case 'canceled':
        case 'incomplete_expired':
            return 'canceled';
        case 'incomplete':
        case 'paused':
        default:
            return 'incomplete';
    }
};

export const mapRazorpaySubscriptionStatus = (status = '') => {
    switch (status) {
        case 'active':
            return 'active';
        case 'authenticated':
        case 'created':
            return 'trialing';
        case 'halted':
        case 'pending':
            return 'past_due';
        case 'completed':
        case 'cancelled':
        case 'cancelled_by_customer':
            return 'canceled';
        default:
            return 'incomplete';
    }
};

export const getCurrentVendorSubscription = async (vendorId) => {
    const subscriptions = await VendorSubscription.find({ vendor: vendorId })
        .populate('plan')
        .sort({ current_period_end: -1, createdAt: -1 });

    if (!subscriptions.length) return null;

    return subscriptions.sort((left, right) => {
        const statusDelta = (STATUS_PRIORITY[right.status] || 0) - (STATUS_PRIORITY[left.status] || 0);
        if (statusDelta !== 0) return statusDelta;
        return new Date(right.current_period_end || 0) - new Date(left.current_period_end || 0);
    })[0];
};

export const upsertSubscriptionRecord = async ({
    vendorId,
    planId,
    gateway,
    gatewayCustomerId = null,
    gatewaySubscriptionId,
    status,
    externalStatus = '',
    currentPeriodStart = null,
    currentPeriodEnd = null,
    cancelAtPeriodEnd = false,
    latestPaymentStatus = 'pending',
    metadata = {},
}) => VendorSubscription.findOneAndUpdate(
    {
        gateway,
        gateway_subscription_id: gatewaySubscriptionId,
    },
    {
        $set: {
            vendor: vendorId,
            plan: planId,
            gateway,
            gateway_customer_id: gatewayCustomerId,
            gateway_subscription_id: gatewaySubscriptionId,
            status,
            external_status: externalStatus,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: Boolean(cancelAtPeriodEnd),
            latest_payment_status: latestPaymentStatus,
            metadata,
        },
    },
    {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    }
);

export const upsertPaymentRecord = async ({
    vendorId,
    subscriptionId,
    gateway,
    amount,
    currency,
    status,
    transactionId = null,
    invoiceId = null,
    raw = {},
}) => {
    const lookup = transactionId
        ? { gateway, transaction_id: transactionId }
        : { gateway, invoice_id: invoiceId };

    return Payment.findOneAndUpdate(
        lookup,
        {
            $set: {
                vendor: vendorId,
                subscription: subscriptionId,
                gateway,
                amount,
                currency,
                status,
                transaction_id: transactionId,
                invoice_id: invoiceId,
                raw,
            },
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );
};

export const activateInternalSubscription = async ({ vendor, plan, gateway }) => {
    const now = new Date();
    const currentPeriodEnd = addPlanIntervalToDate(now, plan);

    const subscription = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId: plan._id,
        gateway,
        gatewayCustomerId: null,
        gatewaySubscriptionId: `internal_${vendor._id}_${plan._id}_${Date.now()}`,
        status: 'active',
        externalStatus: 'internal_active',
        currentPeriodStart: now,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        latestPaymentStatus: 'paid',
        metadata: { internal: true, freePlan: true },
    });

    await upsertPaymentRecord({
        vendorId: vendor._id,
        subscriptionId: subscription._id,
        gateway,
        amount: 0,
        currency: gateway === 'razorpay' ? 'INR' : 'USD',
        status: 'paid',
        invoiceId: `${subscription.gateway_subscription_id}_invoice`,
        raw: { internal: true },
    });

    vendor.selectedPlan = plan._id;
    vendor.onboardingStatus = 'subscription_active';
    vendor.onboardingCompletedAt = new Date();
    await vendor.save({ validateBeforeSave: false });

    return subscription;
};

export const findPlanByGatewayReference = async ({ gateway, referenceId }) => {
    if (!referenceId) return null;
    if (gateway === 'stripe') {
        return SubscriptionPlan.findOne({ stripe_price_id: referenceId });
    }
    if (gateway === 'razorpay') {
        return SubscriptionPlan.findOne({ razorpay_plan_id: referenceId });
    }
    return null;
};

export const findVendorByGatewayCustomerId = async ({ gateway, customerId, vendorId = null }) => {
    if (vendorId) {
        return Vendor.findById(vendorId);
    }

    if (!customerId) return null;

    const path = gateway === 'stripe' ? 'billing.stripeCustomerId' : 'billing.razorpayCustomerId';
    return Vendor.findOne({ [path]: customerId });
};

export const serializeSubscription = async (subscriptionDoc) => {
    if (!subscriptionDoc) return null;

    const subscription = typeof subscriptionDoc.populate === 'function'
        ? await subscriptionDoc.populate('plan')
        : subscriptionDoc;
    const raw = typeof subscription.toObject === 'function'
        ? subscription.toObject({ virtuals: true })
        : { ...subscription };

    return {
        ...raw,
        plan: serializePlan(raw.plan),
        isActive: raw.status === 'active'
            && raw.current_period_end
            && new Date(raw.current_period_end) > new Date(),
    };
};

export const ensureVendorCanChangePlan = async ({ vendor, plan }) => {
    if (!vendor) {
        throw new ApiError(404, 'Vendor not found.');
    }

    if (!plan?.isActive) {
        throw new ApiError(400, 'Selected plan is not available.');
    }
};
