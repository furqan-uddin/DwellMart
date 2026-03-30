import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import VendorSubscription from '../../../models/VendorSubscription.model.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';

// GET /api/vendor/subscription — get current subscription status
export const getCurrentSubscription = asyncHandler(async (req, res) => {
    const subscription = await VendorSubscription.findOne({
        vendorId: req.user.id,
    })
        .populate('planId', 'name price durationDays isTrial currency')
        .sort({ createdAt: -1 })
        .lean();

    if (!subscription) {
        return res.status(200).json(new ApiResponse(200, { hasSubscription: false }, 'No subscription found.'));
    }

    const isActive = subscription.status === 'active'
        && subscription.paymentStatus === 'completed'
        && new Date(subscription.endDate) > new Date();

    res.status(200).json(new ApiResponse(200, {
        hasSubscription: true,
        isActive,
        subscription: {
            ...subscription,
            isExpired: !isActive,
            daysRemaining: isActive ? Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
        },
    }, 'Subscription fetched.'));
});

// GET /api/vendor/subscription/plans — list available plans for renewal
export const getAvailablePlans = asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.status(200).json(new ApiResponse(200, plans, 'Plans fetched.'));
});

// POST /api/vendor/subscription/renew — purchase a new plan / resubscribe
export const renewSubscription = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    if (!planId) throw new ApiError(400, 'Please select a plan.');

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) throw new ApiError(400, 'Selected plan is not available.');

    // Check if vendor already has an active subscription
    const existingActive = await VendorSubscription.findOne({
        vendorId: req.user.id,
        status: 'active',
        paymentStatus: 'completed',
        endDate: { $gt: new Date() },
    });
    if (existingActive) {
        throw new ApiError(400, 'You already have an active subscription. Please wait until it expires to renew.');
    }

    // Prevent multiple trial uses
    if (plan.isTrial) {
        const hadTrial = await VendorSubscription.findOne({
            vendorId: req.user.id,
            paymentStatus: 'completed',
        }).populate('planId').lean();
        if (hadTrial && hadTrial.planId?.isTrial) {
            throw new ApiError(400, 'Trial plan can only be used once.');
        }
    }

    const now = new Date();
    // If they have an existing subscription (even if expired/cancelled), 
    // we should extend from the latest one if it's still in the future,
    // but for "renewal" of an expired one, we start from now.
    const lastSubscription = await VendorSubscription.findOne({ vendorId: req.user.id }).sort({ endDate: -1 });
    const baseDate = (lastSubscription && new Date(lastSubscription.endDate) > now) 
        ? new Date(lastSubscription.endDate) 
        : now;

    const endDate = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await VendorSubscription.create({
        vendorId: req.user.id,
        planId: plan._id,
        startDate: baseDate,
        endDate,
        status: 'active',
        paymentStatus: 'completed', // Renewals are auto-completed for immediate access
    });

    res.status(201).json(new ApiResponse(201, subscription, 'Subscription renewed and activated successfully.'));
});
