import asyncHandler from '../../../utils/asyncHandler.js';
import ApiError from '../../../utils/ApiError.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import BillingWebhookEvent from '../../../models/BillingWebhookEvent.model.js';
import Admin from '../../../models/Admin.model.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';
import VendorSubscription from '../../../models/VendorSubscription.model.js';
import Vendor from '../../../models/Vendor.model.js';
import { createNotification } from '../../../services/notification.service.js';
import { sendVendorOnboardingSuccessEmail } from '../../../services/email.service.js';
import {
    constructStripeWebhookEvent,
    createStripeSubscriptionForPlan,
    retrieveStripeSubscription,
} from '../../../services/billing/stripeBilling.service.js';
import {
    createRazorpaySubscriptionForPlan,
    verifyRazorpayWebhookSignature,
} from '../../../services/billing/razorpayBilling.service.js';
import { createPlanSelection, resolvePlanSelection } from '../../../services/billing/planSelection.service.js';
import { getGatewayForCountry } from '../../../services/billing/gatewaySelector.service.js';
import { getActivePlanById, serializePlan } from '../../../services/billing/plan.service.js';
import {
    activateInternalSubscription,
    findPlanByGatewayReference,
    findVendorByGatewayCustomerId,
    getCurrentVendorSubscription,
    mapRazorpaySubscriptionStatus,
    mapStripeSubscriptionStatus,
    serializeSubscription,
    upsertPaymentRecord,
    upsertSubscriptionRecord,
} from '../../../services/billing/subscriptionState.service.js';

const toDateFromUnix = (value) => (value ? new Date(Number(value) * 1000) : null);
const getWebhookDebugBody = (body) => (Buffer.isBuffer(body) ? body.toString('utf8') : body);

const rememberSubscribedVendor = async (vendor, planId) => {
    if (!vendor) return;
    const shouldNotifyAdmins = vendor.status === 'pending' && vendor.onboardingStatus !== 'subscription_active';
    vendor.selectedPlan = planId;
    vendor.onboardingStatus = 'subscription_active';
    vendor.onboardingCompletedAt = new Date();
    await vendor.save({ validateBeforeSave: false });

    if (shouldNotifyAdmins) {
        const admins = await Admin.find({ isActive: true }).select('_id');
        await Promise.all(
            admins.map((admin) =>
                createNotification({
                    recipientId: admin._id,
                    recipientType: 'admin',
                    title: 'Vendor Subscription Activated',
                    message: `${vendor.storeName || vendor.name} completed subscription billing and is awaiting review.`,
                    type: 'system',
                    data: {
                        vendorId: String(vendor._id),
                        vendorEmail: vendor.email,
                        status: vendor.status,
                        planId: String(planId),
                    },
                })
            )
        );
    }
};

const notifyVendorOfOnboardingCompletion = async (vendor, plan, payment) => {
    try {
        await sendVendorOnboardingSuccessEmail(vendor, plan, payment);
    } catch (err) {
        console.warn(`[Onboarding Email] Failed to send email to ${vendor.email}: ${err.message}`);
    }
};

const syncStripeSubscriptionState = async (stripeSubscription, latestPaymentStatus = 'pending') => {
    if (!stripeSubscription) return null;

    const priceId = stripeSubscription.items?.data?.[0]?.price?.id || null;
    const plan = await findPlanByGatewayReference({ gateway: 'stripe', referenceId: priceId });
    const vendor = await findVendorByGatewayCustomerId({
        gateway: 'stripe',
        customerId: stripeSubscription.customer,
        vendorId: stripeSubscription.metadata?.vendorId || null,
    });

    if (!plan || !vendor) return null;

    const subscription = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId: plan._id,
        gateway: 'stripe',
        gatewayCustomerId: String(stripeSubscription.customer || ''),
        gatewaySubscriptionId: stripeSubscription.id,
        status: mapStripeSubscriptionStatus(stripeSubscription.status),
        externalStatus: stripeSubscription.status,
        currentPeriodStart: toDateFromUnix(stripeSubscription.current_period_start),
        currentPeriodEnd: toDateFromUnix(stripeSubscription.current_period_end),
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        latestPaymentStatus,
        metadata: {
            source: 'stripe',
            latestInvoiceId: stripeSubscription.latest_invoice || null,
        },
    });

    if (subscription.status === 'active' || subscription.status === 'trialing') {
        await rememberSubscribedVendor(vendor, plan._id);
    }

    return { vendor, plan, subscription };
};

const syncRazorpaySubscriptionState = async (subscriptionEntity, latestPaymentStatus = 'pending') => {
    if (!subscriptionEntity) return null;

    const plan = await findPlanByGatewayReference({
        gateway: 'razorpay',
        referenceId: subscriptionEntity.plan_id,
    });
    const vendor = await findVendorByGatewayCustomerId({
        gateway: 'razorpay',
        customerId: subscriptionEntity.notes?.customerId || null,
        vendorId: subscriptionEntity.notes?.vendorId || null,
    });

    if (!plan || !vendor) return null;

    const subscription = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId: plan._id,
        gateway: 'razorpay',
        gatewayCustomerId: subscriptionEntity.notes?.customerId || null,
        gatewaySubscriptionId: subscriptionEntity.id,
        status: mapRazorpaySubscriptionStatus(subscriptionEntity.status),
        externalStatus: subscriptionEntity.status,
        currentPeriodStart: toDateFromUnix(subscriptionEntity.current_start || subscriptionEntity.start_at),
        currentPeriodEnd: toDateFromUnix(subscriptionEntity.current_end || subscriptionEntity.charge_at || subscriptionEntity.end_at),
        cancelAtPeriodEnd: Boolean(subscriptionEntity.cancel_at_cycle_end),
        latestPaymentStatus,
        metadata: {
            source: 'razorpay',
            planId: subscriptionEntity.plan_id,
        },
    });

    if (subscription.status === 'active' || subscription.status === 'trialing') {
        await rememberSubscribedVendor(vendor, plan._id);
    }

    return { vendor, plan, subscription };
};

const storeWebhookEvent = async ({ gateway, eventId, eventType, payload }) => {
    const existing = await BillingWebhookEvent.findOne({ eventId }).lean();
    if (existing) {
        return false;
    }

    await BillingWebhookEvent.create({
        gateway,
        eventId,
        eventType,
        payload,
    });

    return true;
};

export const selectPlan = asyncHandler(async (req, res) => {
    const { planId, country = '' } = req.body;
    const { token, plan } = await createPlanSelection({ planId, country });

    res.status(201).json(
        new ApiResponse(
            201,
            {
                selectionToken: token,
                gateway: getGatewayForCountry(country),
                plan: serializePlan(plan, country),
            },
            'Plan selected successfully.'
        )
    );
});

export const getSubscriptionPlans = asyncHandler(async (req, res) => {
    const country = String(req.query.country || '').trim();
    const plans = await SubscriptionPlan
        .find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(
        new ApiResponse(
            200,
            plans.map((plan) => serializePlan(plan, country)),
            'Subscription plans fetched.'
        )
    );
});

export const initiateOnboardingSubscription = asyncHandler(async (req, res) => {
    const { email, selectionToken, selectedPlanId } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const vendor = await Vendor.findOne({ email: normalizedEmail });

    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');

    const { plan } = await resolvePlanSelection({
        selectionToken,
        selectedPlanId: selectedPlanId || vendor.selectedPlan,
    });
    const gateway = getGatewayForCountry(vendor.country || vendor.address?.country || '');
    const currentSubscription = await getCurrentVendorSubscription(vendor._id);

    vendor.selectedPlan = plan._id;
    vendor.billing = {
        ...(vendor.billing || {}),
        preferredGateway: gateway,
    };
    vendor.onboardingStatus = 'payment_pending';
    await vendor.save({ validateBeforeSave: false });

    if (currentSubscription?.status === 'active' && String(currentSubscription.plan?._id || currentSubscription.plan) === String(plan._id)) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    gateway,
                    subscription: await serializeSubscription(currentSubscription),
                    alreadyActive: true,
                },
                'Subscription is already active for this plan.'
            )
        );
    }

    if (Number(plan.price_inr || 0) === 0 && Number(plan.price_usd || 0) === 0) {
        const internalSubscription = await activateInternalSubscription({ vendor, plan, gateway });
        
        // Notify admins for free plan activation during onboarding
        await rememberSubscribedVendor(vendor, plan._id);

        // Notify vendor for free plan activation during onboarding
        if (vendor.onboardingStatus === 'subscription_active') {
            await notifyVendorOfOnboardingCompletion(vendor, plan, {
                amount: 0,
                currency: vendor.country === 'IN' ? 'INR' : 'USD',
                transactionId: 'FREE_PLAN',
            });
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    gateway,
                    subscription: await serializeSubscription(internalSubscription),
                    status: 'active',
                },
                'Free subscription activated.'
            )
        );
    }

    if (gateway === 'stripe') {
        const stripeResult = await createStripeSubscriptionForPlan({
            vendor,
            plan,
            metadata: { flow: 'onboarding' },
        });
        if (!stripeResult.clientSecret) {
            throw new ApiError(502, 'Stripe did not return a checkout client secret for this subscription.');
        }

        const subscriptionRecord = await upsertSubscriptionRecord({
            vendorId: vendor._id,
            planId: plan._id,
            gateway: 'stripe',
            gatewayCustomerId: stripeResult.customerId,
            gatewaySubscriptionId: stripeResult.subscription.id,
            status: mapStripeSubscriptionStatus(stripeResult.subscription.status),
            externalStatus: stripeResult.subscription.status,
            currentPeriodStart: toDateFromUnix(stripeResult.subscription.current_period_start),
            currentPeriodEnd: toDateFromUnix(stripeResult.subscription.current_period_end),
            cancelAtPeriodEnd: Boolean(stripeResult.subscription.cancel_at_period_end),
            latestPaymentStatus: 'pending',
            metadata: { flow: 'onboarding' },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    gateway: 'stripe',
                    checkout: {
                        clientSecret: stripeResult.clientSecret,
                        publishableKey: stripeResult.publishableKey,
                    },
                    subscription: await serializeSubscription(subscriptionRecord),
                },
                'Stripe subscription created.'
            )
        );
    }

    const razorpayResult = await createRazorpaySubscriptionForPlan({
        vendor,
        plan,
        metadata: { flow: 'onboarding' },
    });
    const subscriptionRecord = await upsertSubscriptionRecord({
        vendorId: vendor._id,
        planId: plan._id,
        gateway: 'razorpay',
        gatewayCustomerId: razorpayResult.customerId,
        gatewaySubscriptionId: razorpayResult.subscription.id,
        status: mapRazorpaySubscriptionStatus(razorpayResult.subscription.status),
        externalStatus: razorpayResult.subscription.status,
        currentPeriodStart: toDateFromUnix(razorpayResult.subscription.current_start || razorpayResult.subscription.start_at),
        currentPeriodEnd: toDateFromUnix(razorpayResult.subscription.current_end || razorpayResult.subscription.charge_at),
        cancelAtPeriodEnd: false,
        latestPaymentStatus: 'pending',
        metadata: { flow: 'onboarding' },
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                gateway: 'razorpay',
                checkout: {
                    keyId: razorpayResult.keyId,
                    subscriptionId: razorpayResult.subscription.id,
                },
                subscription: await serializeSubscription(subscriptionRecord),
            },
            'Razorpay subscription created.'
        )
    );
});

export const handleStripeWebhook = asyncHandler(async (req, res) => {
    console.log('🔥 Stripe webhook hit');
    console.log(req.headers);
    console.log(getWebhookDebugBody(req.body));

    const signature = req.headers['stripe-signature'];
    if (!signature) {
        throw new ApiError(400, 'Missing Stripe signature.');
    }

    const event = constructStripeWebhookEvent(req.body, signature);
    const stored = await storeWebhookEvent({
        gateway: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event.data?.object || {},
    });

    if (!stored) {
        return res.status(200).json({ received: true, duplicate: true });
    }

    switch (event.type) {
        case 'invoice.paid': {
            const invoice = event.data.object;
            if (!invoice.subscription) break;

            const stripeSubscription = await retrieveStripeSubscription(invoice.subscription);
            const synced = await syncStripeSubscriptionState(stripeSubscription, 'paid');

            if (synced) {
                await upsertPaymentRecord({
                    vendorId: synced.vendor._id,
                    subscriptionId: synced.subscription._id,
                    gateway: 'stripe',
                    amount: Number(invoice.amount_paid || 0) / 100,
                    currency: String(invoice.currency || 'usd').toUpperCase(),
                    status: 'paid',
                    transactionId: String(invoice.payment_intent || invoice.charge || invoice.id),
                    invoiceId: invoice.id,
                    raw: invoice,
                });

                // Notify vendor if this is the first payment (onboarding)
                if (synced.vendor.onboardingStatus === 'subscription_active') {
                    await notifyVendorOfOnboardingCompletion(synced.vendor, synced.plan, {
                        amount: Number(invoice.amount_paid || 0) / 100,
                        currency: String(invoice.currency || 'usd').toUpperCase(),
                        transactionId: String(invoice.payment_intent || invoice.charge || invoice.id),
                    });
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            if (!invoice.subscription) break;

            const stripeSubscription = await retrieveStripeSubscription(invoice.subscription);
            const synced = await syncStripeSubscriptionState(stripeSubscription, 'failed');

            if (synced) {
                await upsertPaymentRecord({
                    vendorId: synced.vendor._id,
                    subscriptionId: synced.subscription._id,
                    gateway: 'stripe',
                    amount: Number(invoice.amount_due || 0) / 100,
                    currency: String(invoice.currency || 'usd').toUpperCase(),
                    status: 'failed',
                    transactionId: String(invoice.payment_intent || invoice.id),
                    invoiceId: invoice.id,
                    raw: invoice,
                });
            }
            break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const stripeSubscription = event.data.object;
            await syncStripeSubscriptionState(
                stripeSubscription,
                stripeSubscription.status === 'past_due' ? 'failed' : 'pending'
            );
            break;
        }

        default:
            break;
    }

    return res.status(200).json({ received: true });
});

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    console.log('🔥 Razorpay webhook hit');
    console.log(req.headers);
    console.log(getWebhookDebugBody(req.body));

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        throw new ApiError(400, 'Missing Razorpay signature.');
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const isValidSignature = verifyRazorpayWebhookSignature(rawBody, String(signature));
    if (!isValidSignature) {
        throw new ApiError(400, 'Invalid Razorpay webhook signature.');
    }

    const event = JSON.parse(rawBody);
    const eventId = String(event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || event.event || Date.now());
    const stored = await storeWebhookEvent({
        gateway: 'razorpay',
        eventId: `${event.event}:${eventId}`,
        eventType: event.event,
        payload: event.payload || {},
    });

    if (!stored) {
        return res.status(200).json({ received: true, duplicate: true });
    }

    switch (event.event) {
        case 'subscription.charged': {
            const subscriptionEntity = event.payload?.subscription?.entity;
            const paymentEntity = event.payload?.payment?.entity;
            const synced = await syncRazorpaySubscriptionState(subscriptionEntity, 'paid');

            if (synced && paymentEntity) {
                await upsertPaymentRecord({
                    vendorId: synced.vendor._id,
                    subscriptionId: synced.subscription._id,
                    gateway: 'razorpay',
                    amount: Number(paymentEntity.amount || 0) / 100,
                    currency: String(paymentEntity.currency || 'INR').toUpperCase(),
                    status: 'paid',
                    transactionId: paymentEntity.id,
                    invoiceId: paymentEntity.invoice_id || subscriptionEntity?.id,
                    raw: paymentEntity,
                });

                // Notify vendor if this is the first payment (onboarding)
                if (synced.vendor.onboardingStatus === 'subscription_active') {
                    await notifyVendorOfOnboardingCompletion(synced.vendor, synced.plan, {
                        amount: Number(paymentEntity.amount || 0) / 100,
                        currency: String(paymentEntity.currency || 'INR').toUpperCase(),
                        transactionId: paymentEntity.id,
                    });
                }
            }
            break;
        }

        case 'payment.failed': {
            const paymentEntity = event.payload?.payment?.entity;
            if (!paymentEntity?.subscription_id) break;

            const existingSubscription = await VendorSubscription.findOne({
                gateway: 'razorpay',
                gateway_subscription_id: paymentEntity.subscription_id,
            });
            if (!existingSubscription) break;

            existingSubscription.status = 'past_due';
            existingSubscription.latest_payment_status = 'failed';
            existingSubscription.external_status = 'payment_failed';
            await existingSubscription.save();

            await upsertPaymentRecord({
                vendorId: existingSubscription.vendor,
                subscriptionId: existingSubscription._id,
                gateway: 'razorpay',
                amount: Number(paymentEntity.amount || 0) / 100,
                currency: String(paymentEntity.currency || 'INR').toUpperCase(),
                status: 'failed',
                transactionId: paymentEntity.id,
                invoiceId: paymentEntity.invoice_id || paymentEntity.subscription_id,
                raw: paymentEntity,
            });
            break;
        }

        case 'subscription.completed':
        case 'subscription.activated':
        case 'subscription.authenticated': {
            const subscriptionEntity = event.payload?.subscription?.entity;
            await syncRazorpaySubscriptionState(
                subscriptionEntity,
                event.event === 'subscription.completed' ? 'paid' : 'pending'
            );
            break;
        }

        default:
            break;
    }

    return res.status(200).json({ received: true });
});
