import Stripe from 'stripe';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session
export const createStripeSession = asyncHandler(async (req, res) => {
    const { planId } = req.body;

    if (!planId) {
        throw new ApiError(400, 'Plan ID is required');
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
        throw new ApiError(400, 'Invalid or inactive plan');
    }

    if (plan.price <= 0 || plan.isTrial) {
        return res.status(200).json(new ApiResponse(200, { isFree: true }, 'Free plan selected'));
    }

    let currency = String(plan.currency || 'INR').trim().toLowerCase();
    // Stripe expects 3-letter currency code. If it's "rupees", map to "inr"
    if (currency.length !== 3) {
        currency = 'inr';
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `DwellMart - ${plan.name}`,
                            description: `Subscription for ${plan.durationDays} days`,
                        },
                        unit_amount: Math.round(plan.price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/sell-on-dwellmart?success=true&session_id={CHECKOUT_SESSION_ID}&plan_id=${plan._id}`,
            cancel_url: `${process.env.CLIENT_URL}/sell-on-dwellmart?canceled=true`,
        });

        res.status(200).json(new ApiResponse(200, { sessionId: session.id, url: session.url }, 'Stripe session created'));
    } catch (error) {
        console.error('Stripe Session Error:', error);
        throw new ApiError(500, 'Failed to create Stripe session');
    }
});

// Verify Stripe Payment
export const verifyStripePayment = async (sessionId) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return session.payment_status === 'paid';
    } catch (error) {
        console.error('Stripe Verification Error:', error);
        return false;
    }
};
