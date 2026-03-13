import Commission from '../models/Commission.model.js';
import Vendor from '../models/Vendor.model.js';

/**
 * Calculate commission for a vendor order item group
 * @param {string} vendorId
 * @param {number} subtotal
 * @returns {{ commission, vendorEarnings, commissionRate }}
 */
export const calculateCommission = async (vendorId, subtotal) => {
    const vendor = await Vendor.findById(vendorId).select('commissionRate');
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    const commissionRate = vendor.commissionRate || 10;
    const commission = parseFloat(((subtotal * commissionRate) / 100).toFixed(2));
    const vendorEarnings = parseFloat((subtotal - commission).toFixed(2));

    return { commissionRate, commission, vendorEarnings };
};

/**
 * Get commission summary for a vendor
 */
export const getVendorCommissionSummary = async (vendorId) => {
    const result = await Commission.aggregate([
        { $match: { vendorId: vendorId } },
        {
            $group: {
                _id: '$status',
                total: { $sum: '$vendorEarnings' },
                count: { $sum: 1 },
            },
        },
    ]);

    return result.reduce((acc, r) => {
        acc[r._id] = { total: r.total, count: r.count };
        return acc;
    }, {});
};
