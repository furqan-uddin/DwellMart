import Razorpay from 'razorpay';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';
import crypto from 'crypto';

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order for Subscription
export const createSubscriptionOrder = asyncHandler(async (req, res) => {
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

    let currency = String(plan.currency || 'INR').trim().toUpperCase();
    if (currency.length !== 3) {
        currency = 'INR';
    }

    const options = {
        amount: Math.round(plan.price * 100), // Amount in smallest currency unit
        currency: currency,
        receipt: `receipt_sub_${Date.now()}`,
        notes: {
            planId: plan._id.toString(),
            planName: plan.name,
        }
    };

    try {
        const order = await rzp.orders.create(options);
        res.status(200).json(new ApiResponse(200, { 
            orderId: order.id, 
            amount: order.amount, 
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID 
        }, 'Order created successfully'));
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        throw new ApiError(500, 'Failed to create Razorpay order');
    }
});

// Verify Payment
export const verifySubscriptionPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    return expectedSignature === razorpay_signature;
};
