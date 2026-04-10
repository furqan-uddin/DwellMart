import ApiError from '../../utils/ApiError.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.model.js';
import { getGatewayForCountry } from './gatewaySelector.service.js';

export const buildPlanSlug = (name = '') =>
    String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export const normalizePlanFeatures = (features) => {
    if (Array.isArray(features)) {
        return {
            highlights: features.map((value) => String(value).trim()).filter(Boolean),
        };
    }

    if (typeof features === 'string') {
        const trimmed = features.trim();
        if (!trimmed) return {};
        try {
            const parsed = JSON.parse(trimmed);
            return normalizePlanFeatures(parsed);
        } catch {
            return {
                highlights: trimmed
                    .split('\n')
                    .map((value) => value.trim())
                    .filter(Boolean),
            };
        }
    }

    if (features && typeof features === 'object') {
        const highlights = Array.isArray(features.highlights)
            ? features.highlights.map((value) => String(value).trim()).filter(Boolean)
            : [];

        return {
            ...features,
            ...(highlights.length ? { highlights } : {}),
        };
    }

    return {};
};

export const resolvePlanAmount = (plan, gateway) =>
    gateway === 'razorpay' ? Number(plan?.price_inr || 0) : Number(plan?.price_usd || 0);

export const resolvePlanCurrency = (gateway) =>
    gateway === 'razorpay' ? 'INR' : 'USD';

export const serializePlan = (planDoc, country = '') => {
    if (!planDoc) return null;

    const plan = typeof planDoc.toObject === 'function'
        ? planDoc.toObject({ virtuals: true })
        : { ...planDoc };
    const gateway = getGatewayForCountry(country);
    const displayCurrency = resolvePlanCurrency(gateway);
    const displayPrice = resolvePlanAmount(plan, gateway);
    const features = normalizePlanFeatures(plan.features);

    return {
        ...plan,
        features,
        featureHighlights: Array.isArray(features.highlights) ? features.highlights : [],
        gateway,
        pricing: {
            inr: Number(plan.price_inr || 0),
            usd: Number(plan.price_usd || 0),
        },
        displayPrice,
        displayCurrency,
        displayLabel: `${displayCurrency} ${displayPrice.toFixed(2)}/${plan.interval}`,
        isFree: Number(plan.price_inr || 0) === 0 && Number(plan.price_usd || 0) === 0,
    };
};

export const getActivePlanById = async (planId) => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
        throw new ApiError(400, 'Selected subscription plan is not available.');
    }
    return plan;
};
