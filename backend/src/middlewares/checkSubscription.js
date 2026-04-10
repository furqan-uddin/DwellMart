import ApiError from '../utils/ApiError.js';
import { getCurrentVendorSubscription } from '../services/billing/subscriptionState.service.js';

const checkSubscription = async (req, res, next) => {
    try {
        const subscription = await getCurrentVendorSubscription(req.user.id);

        const isActive = Boolean(
            subscription
            && subscription.status === 'active'
            && subscription.current_period_end
            && new Date(subscription.current_period_end) > new Date()
        );

        if (!isActive) {
            const error = new ApiError(403, 'Your subscription is inactive. Please update your plan to continue.');
            error.errorCode = 'SUBSCRIPTION_INACTIVE';
            return next(error);
        }

        req.subscription = subscription;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default checkSubscription;
