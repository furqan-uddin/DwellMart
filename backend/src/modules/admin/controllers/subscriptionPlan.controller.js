import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';
import VendorSubscription from '../../../models/VendorSubscription.model.js';

// GET /api/admin/subscription-plans
export const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json(new ApiResponse(200, plans, 'Subscription plans fetched.'));
});

// GET /api/admin/subscription-plans/:id
export const getPlanById = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) throw new ApiError(404, 'Plan not found.');
    res.status(200).json(new ApiResponse(200, plan, 'Plan fetched.'));
});

// POST /api/admin/subscription-plans
export const createPlan = asyncHandler(async (req, res) => {
    const { name, price, durationDays, description, features, isTrial, isMostPopular, isActive, sortOrder, currency } = req.body;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) throw new ApiError(400, 'Plan name is required.');
    if (durationDays == null || durationDays < 1) throw new ApiError(400, 'Duration must be at least 1 day.');
    if (price == null || price < 0) throw new ApiError(400, 'Price must be 0 or above.');

    // Generate slug from the name
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await SubscriptionPlan.findOne({ slug });
    if (existing) throw new ApiError(409, 'A plan with a similar name already exists.');

    // If isTrial, ensure only one trial plan exists
    if (isTrial) {
        const existingTrial = await SubscriptionPlan.findOne({ isTrial: true });
        if (existingTrial) throw new ApiError(409, 'Only one trial plan is allowed. Deactivate or delete the existing one first.');
    }

    const plan = await SubscriptionPlan.create({
        name: trimmedName,
        slug,
        price: Number(price),
        currency: currency || 'AED',
        durationDays: Number(durationDays),
        description: String(description || '').trim(),
        features: Array.isArray(features) ? features.map(f => String(f).trim()).filter(Boolean) : [],
        isTrial: !!isTrial,
        isMostPopular: !!isMostPopular,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json(new ApiResponse(201, plan, 'Subscription plan created.'));
});

// PUT /api/admin/subscription-plans/:id
export const updatePlan = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) throw new ApiError(404, 'Plan not found.');

    const { name, price, durationDays, description, features, isTrial, isMostPopular, isActive, sortOrder, currency } = req.body;

    if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) throw new ApiError(400, 'Plan name is required.');
        const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const existing = await SubscriptionPlan.findOne({ slug, _id: { $ne: plan._id } });
        if (existing) throw new ApiError(409, 'A plan with a similar name already exists.');
        plan.name = trimmedName;
        plan.slug = slug;
    }
    if (price !== undefined) plan.price = Number(price);
    if (currency !== undefined) plan.currency = String(currency).trim();
    if (durationDays !== undefined) plan.durationDays = Number(durationDays);
    if (description !== undefined) plan.description = String(description).trim();
    if (features !== undefined) plan.features = Array.isArray(features) ? features.map(f => String(f).trim()).filter(Boolean) : [];
    if (isTrial !== undefined) {
        if (isTrial && !plan.isTrial) {
            const existingTrial = await SubscriptionPlan.findOne({ isTrial: true, _id: { $ne: plan._id } });
            if (existingTrial) throw new ApiError(409, 'Only one trial plan is allowed.');
        }
        plan.isTrial = !!isTrial;
    }
    if (isMostPopular !== undefined) plan.isMostPopular = !!isMostPopular;
    if (isActive !== undefined) plan.isActive = !!isActive;
    if (sortOrder !== undefined) plan.sortOrder = Number(sortOrder);

    await plan.save();
    res.status(200).json(new ApiResponse(200, plan, 'Subscription plan updated.'));
});

// DELETE /api/admin/subscription-plans/:id
export const deletePlan = asyncHandler(async (req, res) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) throw new ApiError(404, 'Plan not found.');

    // Check if any active subscriptions use this plan
    const activeSubCount = await VendorSubscription.countDocuments({
        planId: plan._id,
        status: 'active',
        endDate: { $gt: new Date() },
    });
    if (activeSubCount > 0) {
        throw new ApiError(400, `Cannot delete: ${activeSubCount} active subscription(s) use this plan. Deactivate it instead.`);
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Subscription plan deleted.'));
});

// GET /api/admin/vendor-subscriptions
export const getVendorSubscriptions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, vendorId } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (vendorId) filter.vendorId = vendorId;

    const [subscriptions, total] = await Promise.all([
        VendorSubscription.find(filter)
            .populate('vendorId', 'name email storeName')
            .populate('planId', 'name price durationDays')
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber),
        VendorSubscription.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        subscriptions,
        pagination: { total, page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
    }, 'Vendor subscriptions fetched.'));
});

// PATCH /api/admin/vendor-subscriptions/:id/confirm-payment
export const confirmSubscriptionPayment = asyncHandler(async (req, res) => {
    const subscription = await VendorSubscription.findById(req.params.id);
    if (!subscription) throw new ApiError(404, 'Subscription not found.');
    if (subscription.paymentStatus === 'completed') throw new ApiError(400, 'Payment already confirmed.');

    subscription.paymentStatus = 'completed';
    subscription.status = 'active';
    subscription.paymentDetails = {
        ...subscription.paymentDetails,
        method: 'admin_confirmation',
        confirmedBy: req.user.id,
        confirmedAt: new Date(),
        notes: String(req.body.notes || '').trim(),
    };

    await subscription.save();
    res.status(200).json(new ApiResponse(200, subscription, 'Payment confirmed. Subscription is now active.'));
});
