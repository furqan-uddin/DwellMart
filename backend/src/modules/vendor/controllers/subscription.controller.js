import asyncHandler from '../../../utils/asyncHandler.js';
import ApiError from '../../../utils/ApiError.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';
import Vendor from '../../../models/Vendor.model.js';
import { getGatewayForCountry } from '../../../services/billing/gatewaySelector.service.js';
import { getActivePlanById, serializePlan } from '../../../services/billing/plan.service.js';
import {
    cancelRazorpaySubscriptionAtCycleEnd,
    createRazorpaySubscriptionForPlan,
} from '../../../services/billing/razorpayBilling.service.js';
import {
    createStripeSubscriptionForPlan,
    retrieveStripeSubscription,
    updateStripeSubscriptionPlan,
} from '../../../services/billing/stripeBilling.service.js';
import {
    activateInternalSubscription,
    findPlanByGatewayReference,
    getCurrentVendorSubscription,
    mapRazorpaySubscriptionStatus,
    mapStripeSubscriptionStatus,
    serializeSubscription,
    upsertSubscriptionRecord,
} from '../../../services/billing/subscriptionState.service.js';

const toDateFromUnix = (value) => (value ? new Date(Number(value) * 1000) : null);

const isSubscriptionActive = (subscription) => Boolean(
    subscription
    && (subscription.status === 'active' || subscription.status === 'trialing')
    && subscription.current_period_end
    && new Date(subscription.current_period_end) > new Date()
);

const getStripePeriodDate = (stripeSubscription, key) => (
    stripeSubscription?.[key] || stripeSubscription?.items?.data?.[0]?.[key] || null
);

const syncStripeSubscriptionIfPossible = async (vendor, subscription) => {
    const subscriptionId = String(subscription?.gateway_subscription_id || '');
    if (
        !vendor
        || !subscription
        || subscription.gateway !== 'stripe'
        || !subscriptionId
        || subscriptionId.startsWith('internal_')
    ) {
        return subscription;
    }

    const stripeSubscription = await retrieveStripeSubscription(subscriptionId);
    const priceId = stripeSubscription.items?.data?.[0]?.price?.id || null;
    const stripePlan = await findPlanByGatewayReference({ gateway: 'stripe', referenceId: priceId });
    const planId = stripePlan?._id || subscription.plan?._id || subscription.plan;
    const status = mapStripeSubscriptionStatus(stripeSubscription.status);

    const synced = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId,
        gateway: 'stripe',
        gatewayCustomerId: String(stripeSubscription.customer || subscription.gateway_customer_id || ''),
        gatewaySubscriptionId: stripeSubscription.id,
        status,
        externalStatus: stripeSubscription.status,
        currentPeriodStart: toDateFromUnix(getStripePeriodDate(stripeSubscription, 'current_period_start')),
        currentPeriodEnd: toDateFromUnix(getStripePeriodDate(stripeSubscription, 'current_period_end')),
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        latestPaymentStatus: status === 'active' || status === 'trialing'
            ? 'paid'
            : subscription.latest_payment_status || 'pending',
        metadata: {
            ...(subscription.metadata || {}),
            source: 'stripe_sync',
            latestInvoiceId: stripeSubscription.latest_invoice || null,
        },
    });

    if (status === 'active' || status === 'trialing') {
        vendor.selectedPlan = planId;
        vendor.onboardingStatus = 'subscription_active';
        vendor.onboardingCompletedAt = vendor.onboardingCompletedAt || new Date();
        await vendor.save({ validateBeforeSave: false });
    }

    return synced;
};

const toChangePlanResponse = async ({ gateway, checkout = null, subscription, message }) => ({
    gateway,
    checkout,
    subscription: await serializeSubscription(subscription),
    message,
});

export const getCurrentSubscription = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.user.id);
    const currentSubscription = await getCurrentVendorSubscription(req.user.id);
    const subscription = await syncStripeSubscriptionIfPossible(vendor, currentSubscription);

    if (!subscription) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { hasSubscription: false, isActive: false, subscription: null },
                'No subscription found.'
            )
        );
    }

    const serialized = await serializeSubscription(subscription);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                hasSubscription: true,
                isActive: serialized.isActive,
                subscription: serialized,
            },
            'Subscription fetched.'
        )
    );
});

export const getAvailablePlans = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.user.id).select('country');
    const plans = await SubscriptionPlan
        .find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(
        new ApiResponse(
            200,
            plans.map((plan) => serializePlan(plan, vendor?.country || '')),
            'Plans fetched.'
        )
    );
});

export const changePlan = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    if (!planId) throw new ApiError(400, 'Please select a plan.');

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const plan = await getActivePlanById(planId);
    const gateway = getGatewayForCountry(vendor.country || vendor.address?.country || '');
    const currentSubscription = await syncStripeSubscriptionIfPossible(
        vendor,
        await getCurrentVendorSubscription(vendor._id)
    );

    vendor.selectedPlan = plan._id;
    vendor.billing = {
        ...(vendor.billing || {}),
        preferredGateway: gateway,
    };
    await vendor.save({ validateBeforeSave: false });

    if (isSubscriptionActive(currentSubscription) && String(currentSubscription.plan?._id || currentSubscription.plan) === String(plan._id)) {
        return res.status(200).json(
            new ApiResponse(
                200,
                await toChangePlanResponse({
                    gateway,
                    subscription: currentSubscription,
                    message: 'You are already subscribed to this plan.',
                }),
                'You are already subscribed to this plan.'
            )
        );
    }

    if (Number(plan.price_inr || 0) === 0 && Number(plan.price_usd || 0) === 0) {
        const subscription = await activateInternalSubscription({ vendor, plan, gateway });
        return res.status(200).json(
            new ApiResponse(
                200,
                await toChangePlanResponse({
                    gateway,
                    subscription,
                    message: 'Free subscription activated.',
                }),
                'Free subscription activated.'
            )
        );
    }

    if (gateway === 'stripe') {
        const shouldCreateNewSubscription = !currentSubscription
            || currentSubscription.gateway !== 'stripe'
            || !currentSubscription.gateway_subscription_id
            || currentSubscription.status === 'canceled'
            || currentSubscription.gateway_subscription_id.startsWith('internal_');

        if (shouldCreateNewSubscription) {
            const created = await createStripeSubscriptionForPlan({
                vendor,
                plan,
                metadata: { flow: 'vendor_change' },
            });
            const subscription = await upsertSubscriptionRecord({
                vendorId: vendor._id,
                planId: plan._id,
                gateway: 'stripe',
                gatewayCustomerId: created.customerId,
                gatewaySubscriptionId: created.subscription.id,
                status: mapStripeSubscriptionStatus(created.subscription.status),
                externalStatus: created.subscription.status,
                currentPeriodStart: toDateFromUnix(created.subscription.current_period_start),
                currentPeriodEnd: toDateFromUnix(created.subscription.current_period_end),
                cancelAtPeriodEnd: Boolean(created.subscription.cancel_at_period_end),
                latestPaymentStatus: 'pending',
                metadata: { flow: 'vendor_change' },
            });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    await toChangePlanResponse({
                        gateway: 'stripe',
                        checkout: {
                            clientSecret: created.clientSecret,
                            publishableKey: created.publishableKey,
                        },
                        subscription,
                        message: 'Stripe subscription created.',
                    }),
                    'Stripe subscription created.'
                )
            );
        }

        const updated = await updateStripeSubscriptionPlan({
            subscriptionId: currentSubscription.gateway_subscription_id,
            plan,
        });
        const subscription = await upsertSubscriptionRecord({
            vendorId: vendor._id,
            planId: plan._id,
            gateway: 'stripe',
            gatewayCustomerId: currentSubscription.gateway_customer_id,
            gatewaySubscriptionId: updated.subscription.id,
            status: mapStripeSubscriptionStatus(updated.subscription.status),
            externalStatus: updated.subscription.status,
            currentPeriodStart: toDateFromUnix(updated.subscription.current_period_start),
            currentPeriodEnd: toDateFromUnix(updated.subscription.current_period_end),
            cancelAtPeriodEnd: Boolean(updated.subscription.cancel_at_period_end),
            latestPaymentStatus: updated.clientSecret ? 'pending' : 'paid',
            metadata: { flow: 'vendor_change', previousPlanId: String(currentSubscription.plan?._id || currentSubscription.plan) },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                await toChangePlanResponse({
                    gateway: 'stripe',
                    checkout: updated.clientSecret
                        ? {
                            clientSecret: updated.clientSecret,
                            publishableKey: updated.publishableKey,
                        }
                        : null,
                    subscription,
                    message: 'Stripe subscription updated.',
                }),
                'Stripe subscription updated.'
            )
        );
    }

    if (currentSubscription?.gateway === 'razorpay' && currentSubscription.status === 'active') {
        await cancelRazorpaySubscriptionAtCycleEnd(currentSubscription.gateway_subscription_id);
        currentSubscription.cancel_at_period_end = true;
        await currentSubscription.save();
    }

    const created = await createRazorpaySubscriptionForPlan({
        vendor,
        plan,
        metadata: { flow: 'vendor_change' },
    });
    const subscription = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId: plan._id,
        gateway: 'razorpay',
        gatewayCustomerId: created.customerId,
        gatewaySubscriptionId: created.subscription.id,
        status: mapRazorpaySubscriptionStatus(created.subscription.status),
        externalStatus: created.subscription.status,
        currentPeriodStart: toDateFromUnix(created.subscription.current_start || created.subscription.start_at),
        currentPeriodEnd: toDateFromUnix(created.subscription.current_end || created.subscription.charge_at),
        cancelAtPeriodEnd: false,
        latestPaymentStatus: 'pending',
        metadata: { flow: 'vendor_change' },
    });

    res.status(200).json(
        new ApiResponse(
            200,
            await toChangePlanResponse({
                gateway: 'razorpay',
                checkout: {
                    keyId: created.keyId,
                    subscriptionId: created.subscription.id,
                },
                subscription,
                message: 'Razorpay subscription created.',
            }),
            'Razorpay subscription created.'
        )
    );
});
