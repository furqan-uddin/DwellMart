import Stripe from 'stripe';
import ApiError from '../../utils/ApiError.js';
import { normalizePlanInterval, resolvePlanAmount } from './plan.service.js';

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

const shouldFallbackToLegacySubscriptionSecret = (error) => {
    const message = String(error?.message || error?.raw?.message || '').toLowerCase();
    return (
        message.includes('billing_mode')
        || message.includes('confirmation_secret')
        || message.includes('unknown parameter')
        || message.includes('cannot expand')
    );
};

const resolveStripeClientSecret = (subscription) => {
    const invoice = subscription?.latest_invoice;
    return (
        invoice?.confirmation_secret?.client_secret
        || invoice?.payment_intent?.client_secret
        || subscription?.pending_setup_intent?.client_secret
        || null
    );
};

export const syncStripePriceForPlan = async (plan) => {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    if (Number(plan.price_usd || 0) <= 0) return null;

    const stripe = getStripeClient();
    const planInterval = normalizePlanInterval({
        interval: plan.interval,
        intervalCount: plan.interval_count,
        gateway: 'stripe',
    });
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
            interval: planInterval.interval,
            interval_count: planInterval.interval_count,
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

    const subscriptionPayload = {
        customer: customerId,
        items: [{ price: plan.stripe_price_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
            save_default_payment_method: 'on_subscription',
        },
        collection_method: 'charge_automatically',
        billing_mode: {
            type: 'flexible',
        },
        expand: ['latest_invoice.confirmation_secret', 'pending_setup_intent'],
        metadata: {
            vendorId: String(vendor._id),
            planId: String(plan._id),
            ...metadata,
        },
    };

    let subscription;
    try {
        subscription = await stripe.subscriptions.create({
            ...subscriptionPayload,
            billing_mode: {
                type: 'flexible',
            },
            expand: ['latest_invoice.confirmation_secret', 'pending_setup_intent'],
        });
    } catch (error) {
        if (!shouldFallbackToLegacySubscriptionSecret(error)) throw error;
        subscription = await stripe.subscriptions.create({
            ...subscriptionPayload,
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });
    }

    return {
        customerId,
        subscription,
        clientSecret: resolveStripeClientSecret(subscription),
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

    const updatePayload = {
        items: [{ id: currentItemId, price: plan.stripe_price_id }],
        proration_behavior: 'always_invoice',
        payment_behavior: 'pending_if_incomplete',
    };

    let updated;
    try {
        updated = await stripe.subscriptions.update(subscriptionId, {
            ...updatePayload,
            expand: ['latest_invoice.confirmation_secret', 'pending_setup_intent'],
        });
    } catch (error) {
        if (!shouldFallbackToLegacySubscriptionSecret(error)) throw error;
        updated = await stripe.subscriptions.update(subscriptionId, {
            ...updatePayload,
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });
    }

    return {
        subscription: updated,
        clientSecret: resolveStripeClientSecret(updated),
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
