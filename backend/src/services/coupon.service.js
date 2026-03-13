import Coupon from '../models/Coupon.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Validate a coupon code against a cart total
 * @param {string} code - Coupon code
 * @param {number} cartTotal - Cart subtotal
 * @returns {{ coupon, discount }}
 */
export const validateCoupon = async (code, cartTotal) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new ApiError(400, 'Invalid coupon code.');
    if (coupon.startsAt && coupon.startsAt > Date.now()) throw new ApiError(400, 'Coupon is not active yet.');
    if (coupon.expiresAt && coupon.expiresAt < Date.now()) throw new ApiError(400, 'Coupon has expired.');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
    if (cartTotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);

    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    return { coupon, discount: parseFloat(discount.toFixed(2)) };
};

/**
 * Increment coupon usage count
 */
export const incrementCouponUsage = async (couponId) => {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};
