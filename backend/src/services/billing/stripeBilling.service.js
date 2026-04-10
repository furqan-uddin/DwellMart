import Stripe from 'stripe';
import ApiError from '../../utils/ApiError.js';
import { resolvePlanAmount } from './plan.service.js';

let stripeClient = null;

const getStripeClient = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new ApiError(500, 'Stripe is not configured on the server.');
    }

    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    return stripeClient;
};

export const isStripeConfigured = () =>
    Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export const syncStripePriceForPlan = async (plan) => {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    if (Number(plan.price_usd || 0) <= 0) return null;

    const stripe = getStripeClient();
    const product = await stripe.products.create({
        name: plan.name,
        description: plan.description || undefined,
        metadata: {
            planId: String(plan._id),
            slug: plan.slug,
        },
    });

    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(resolvePlanAmount(plan, 'stripe') * 100),
        currency: 'usd',
        recurring: {
            interval: plan.interval,
            interval_count: 1,
        },
        metadata: {
            planId: String(plan._id),
            slug: plan.slug,
        },
    });

    return price.id;
};

export const ensureStripeCustomer = async (vendor) => {
    if (vendor.billing?.stripeCustomerId) {
        return vendor.billing.stripeCustomerId;
    }

    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
        email: vendor.email,
        name: vendor.storeName || vendor.name,
        phone: vendor.phone || undefined,
        metadata: {
            vendorId: String(vendor._id),
        },
    });

    vendor.billing = {
        ...(vendor.billing || {}),
        stripeCustomerId: customer.id,
        preferredGateway: 'stripe',
    };
    await vendor.save({ validateBeforeSave: false });

    return customer.id;
};

export const createStripeSubscriptionForPlan = async ({ vendor, plan, metadata = {} }) => {
    if (!plan.stripe_price_id) {
        throw new ApiError(400, 'This plan is not yet configured for Stripe billing.');
    }

    const stripe = getStripeClient();
    const customerId = await ensureStripeCustomer(vendor);

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripe_price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
            save_default_payment_method: 'on_subscription',
        },
        collection_method: 'charge_automatically',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            vendorId: String(vendor._id),
            planId: String(plan._id),
            ...metadata,
        },
    });

    return {
        customerId,
        subscription,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    };
};

export const updateStripeSubscriptionPlan = async ({ subscriptionId, plan }) => {
    if (!plan.stripe_price_id) {
        throw new ApiError(400, 'This plan is not yet configured for Stripe billing.');
    }

    const stripe = getStripeClient();
    const current = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = current.items?.data?.[0]?.id;

    if (!currentItemId) {
        throw new ApiError(400, 'Stripe subscription items could not be resolved.');
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: currentItemId, price: plan.stripe_price_id }],
        proration_behavior: 'always_invoice',
        payment_behavior: 'pending_if_incomplete',
        cancel_at_period_end: false,
        expand: ['latest_invoice.payment_intent'],
    });

    return {
        subscription: updated,
        clientSecret: updated.latest_invoice?.payment_intent?.client_secret || null,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    };
};

export const retrieveStripeSubscription = async (subscriptionId) => {
    const stripe = getStripeClient();
    return stripe.subscriptions.retrieve(subscriptionId);
};

export const constructStripeWebhookEvent = (rawBody, signature) => {
    const stripe = getStripeClient();
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new ApiError(500, 'Stripe webhook secret is not configured.');
    }

    return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
};
