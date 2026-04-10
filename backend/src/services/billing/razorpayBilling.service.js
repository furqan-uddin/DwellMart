import crypto from 'crypto';
import Razorpay from 'razorpay';
import ApiError from '../../utils/ApiError.js';
import { normalizePlanInterval, resolvePlanAmount } from './plan.service.js';

let razorpayClient = null;

const mapPlanIntervalToRazorpayPeriod = (interval = '') => {
    if (interval === 'day') return 'daily';
    if (interval === 'week') return 'weekly';
    if (interval === 'month') return 'monthly';
    if (interval === 'year') return 'yearly';
    return interval;
};

const getRazorpayClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new ApiError(500, 'Razorpay is not configured on the server.');
    }

    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    return razorpayClient;
};

export const isRazorpayConfigured = () =>
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);

export const syncRazorpayPlanForPlan = async (plan) => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
    if (Number(plan.price_inr || 0) <= 0) return null;

    const razorpay = getRazorpayClient();
    const planInterval = normalizePlanInterval({
        interval: plan.interval,
        intervalCount: plan.interval_count,
        gateway: 'razorpay',
    });
    const createdPlan = await razorpay.plans.create({
        period: mapPlanIntervalToRazorpayPeriod(planInterval.interval),
        interval: planInterval.interval_count,
        item: {
            name: plan.name,
            description: plan.description || undefined,
            amount: Math.round(resolvePlanAmount(plan, 'razorpay') * 100),
            currency: 'INR',
        },
        notes: {
            planId: String(plan._id),
            slug: plan.slug,
        },
    });

    return createdPlan.id;
};

export const ensureRazorpayCustomer = async (vendor) => {
    if (vendor.billing?.razorpayCustomerId) {
        return vendor.billing.razorpayCustomerId;
    }

    const razorpay = getRazorpayClient();
    const customer = await razorpay.customers.create({
        name: vendor.storeName || vendor.name,
        email: vendor.email,
        contact: vendor.phone || undefined,
        fail_existing: 0,
        notes: {
            vendorId: String(vendor._id),
        },
    });

    vendor.billing = {
        ...(vendor.billing || {}),
        razorpayCustomerId: customer.id,
        preferredGateway: 'razorpay',
    };
    await vendor.save({ validateBeforeSave: false });

    return customer.id;
};

export const createRazorpaySubscriptionForPlan = async ({ vendor, plan, metadata = {} }) => {
    if (!plan.razorpay_plan_id) {
        throw new ApiError(400, 'This plan is not yet configured for Razorpay billing.');
    }

    const razorpay = getRazorpayClient();
    const customerId = await ensureRazorpayCustomer(vendor);

    const subscription = await razorpay.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        total_count: plan.interval === 'year' ? 10 : 120,
        customer_notify: 1,
        quantity: 1,
        notes: {
            vendorId: String(vendor._id),
            planId: String(plan._id),
            customerId,
            ...Object.fromEntries(
                Object.entries(metadata).map(([key, value]) => [key, String(value)])
            ),
        },
    });

    return {
        customerId,
        subscription,
        keyId: process.env.RAZORPAY_KEY_ID,
    };
};

export const cancelRazorpaySubscriptionAtCycleEnd = async (subscriptionId) => {
    const razorpay = getRazorpayClient();
    return razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
};

export const verifyRazorpayWebhookSignature = (rawBody, signature) => {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        throw new ApiError(500, 'Razorpay webhook secret is not configured.');
    }

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (String(signature).length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
