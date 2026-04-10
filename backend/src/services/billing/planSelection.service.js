import crypto from 'crypto';
import ApiError from '../../utils/ApiError.js';
import OnboardingPlanSelection from '../../models/OnboardingPlanSelection.model.js';
import { getActivePlanById } from './plan.service.js';

const DEFAULT_SELECTION_TTL_MS = 1000 * 60 * 60 * 24;

export const createPlanSelection = async ({ planId, country = '', metadata = {} }) => {
    const plan = await getActivePlanById(planId);
    const token = crypto.randomBytes(32).toString('hex');

    await OnboardingPlanSelection.create({
        token,
        plan: plan._id,
        country: String(country || '').trim(),
        metadata,
        expiresAt: new Date(Date.now() + DEFAULT_SELECTION_TTL_MS),
    });

    return { token, plan };
};

export const resolvePlanSelection = async ({ selectionToken, selectedPlanId }) => {
    if (selectionToken) {
        const selection = await OnboardingPlanSelection.findOne({
            token: String(selectionToken).trim(),
            expiresAt: { $gt: new Date() },
        }).populate('plan');

        if (!selection || !selection.plan || !selection.plan.isActive) {
            throw new ApiError(400, 'Selected plan session is invalid or has expired.');
        }

        return {
            plan: selection.plan,
            selection,
        };
    }

    if (selectedPlanId) {
        const plan = await getActivePlanById(selectedPlanId);
        return { plan, selection: null };
    }

    throw new ApiError(400, 'Please select a subscription plan.');
};
