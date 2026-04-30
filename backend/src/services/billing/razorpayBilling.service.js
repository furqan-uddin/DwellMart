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

const normalizeContact = (value = '') => String(value || '').replace(/\D/g, '');

const isExistingCustomerError = (error) => {
    const description = String(error?.error?.description || error?.description || error?.message || '').toLowerCase();
    return description.includes('customer already exists');
};

const findExistingRazorpayCustomer = async (vendor) => {
    const razorpay = getRazorpayClient();
    const normalizedEmail = String(vendor?.email || '').trim().toLowerCase();
    const normalizedContact = normalizeContact(vendor?.phone || '');
    const vendorId = String(vendor?._id || '');

    let skip = 0;
    const count = 100;

    while (skip < 1000) {
        const response = await razorpay.customers.all({ count, skip });
        const items = Array.isArray(response?.items) ? response.items : [];
        if (!items.length) break;

        const matched = items.find((customer) => {
            const customerEmail = String(customer?.email || '').trim().toLowerCase();
            const customerContact = normalizeContact(customer?.contact || '');
            const customerVendorId = String(customer?.notes?.vendorId || '').trim();

            return (
                (vendorId && customerVendorId === vendorId)
                || (normalizedEmail && customerEmail === normalizedEmail)
                || (normalizedContact && customerContact === normalizedContact)
            );
        });

        if (matched?.id) {
            return matched;
        }

        if (items.length < count) break;
        skip += count;
    }

    return null;
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
    const existingCustomerId = String(vendor.billing?.razorpayCustomerId || '').trim();
    if (existingCustomerId) {
        try {
            await getRazorpayClient().customers.fetch(existingCustomerId);
            return existingCustomerId;
        } catch {
            vendor.billing = {
                ...(vendor.billing || {}),
                razorpayCustomerId: null,
            };
        }
    }

    const razorpay = getRazorpayClient();
    let customer;

    try {
        customer = await razorpay.customers.create({
            name: vendor.storeName || vendor.name,
            email: vendor.email,
            contact: vendor.phone || undefined,
            fail_existing: 0,
            notes: {
                vendorId: String(vendor._id),
            },
        });
    } catch (error) {
        if (!isExistingCustomerError(error)) {
            throw error;
        }

        customer = await findExistingRazorpayCustomer(vendor);
        if (!customer?.id) {
            throw error;
        }
    }

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

export const fetchRazorpaySubscription = async (subscriptionId) => {
    const razorpay = getRazorpayClient();
    return razorpay.subscriptions.fetch(subscriptionId);
};

export const fetchRazorpayPayment = async (paymentId) => {
    const razorpay = getRazorpayClient();
    return razorpay.payments.fetch(paymentId);
};

export const verifyRazorpayPaymentSignature = ({ paymentId, subscriptionId, signature }) => {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new ApiError(500, 'Razorpay is not configured on the server.');
    }

    if (!paymentId || !subscriptionId || !signature) {
        return false;
    }

    const payload = `${paymentId}|${subscriptionId}`;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

    if (String(signature).length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
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
