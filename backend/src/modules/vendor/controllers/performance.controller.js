import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import Order from '../../../models/Order.model.js';
import Product from '../../../models/Product.model.js';
import Commission from '../../../models/Commission.model.js';

const getCustomerKey = (order) => {
    const userId = order?.userId?._id || order?.userId;
    if (userId) return `user:${String(userId)}`;

    const guestEmail = String(order?.guestInfo?.email || order?.shippingAddress?.email || '').trim().toLowerCase();
    if (guestEmail) return `guest-email:${guestEmail}`;

    const guestPhone = String(order?.guestInfo?.phone || order?.shippingAddress?.phone || '').trim();
    if (guestPhone) return `guest-phone:${guestPhone}`;

    return `guest-order:${order?.orderId ?? order?._id}`;
};

export const getPerformanceMetrics = asyncHandler(async (req, res) => {
    const [orders, totalProducts, commissions] = await Promise.all([
        Order.find({ 'vendorItems.vendorId': req.user.id })
            .select('userId guestInfo shippingAddress orderId status isDeleted vendorItems')
            .lean(),
        Product.countDocuments({ vendorId: req.user.id }),
        Commission.find({ vendorId: req.user.id })
            .select('vendorEarnings status')
            .lean(),
    ]);

    const isOrderActive = (order) => {
        if (order?.isDeleted) return false;
        const orderStatus = String(order?.status || '').toLowerCase();
        if (orderStatus === 'cancelled' || orderStatus === 'returned') return false;

        const vendorItem = (order?.vendorItems || []).find(
            (item) => String(item?.vendorId) === String(req.user.id)
        );
        const vendorStatus = String(vendorItem?.status || '').toLowerCase();
        if (vendorStatus === 'cancelled') return false;
        return true;
    };

    const activeOrders = orders.filter(isOrderActive);
    const totalOrders = activeOrders.length;
    const customerSet = new Set();
    for (const order of activeOrders) {
        customerSet.add(getCustomerKey(order));
    }

    const earnings = commissions.reduce(
        (acc, commission) => {
            if (String(commission?.status || '').toLowerCase() === 'cancelled') return acc;
            const vendorEarnings = Number(commission?.vendorEarnings || 0);
            acc.totalEarnings += vendorEarnings;
            if (commission?.status === 'pending') acc.pendingEarnings += vendorEarnings;
            if (commission?.status === 'paid') acc.paidEarnings += vendorEarnings;
            return acc;
        },
        { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 }
    );

    const deliveredOrders = activeOrders.filter((order) => {
        const vendorItem = (order?.vendorItems || []).find(
            (item) => String(item?.vendorId) === String(req.user.id)
        );
        return String(vendorItem?.status || order?.status || '').toLowerCase() === 'delivered';
    }).length;

    const metrics = {
        totalRevenue: earnings.totalEarnings,
        totalOrders,
        totalProducts,
        avgOrderValue: totalOrders > 0 ? earnings.totalEarnings / totalOrders : 0,
        customerCount: customerSet.size,
        conversionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                metrics,
                earnings,
            },
            'Performance metrics fetched.'
        )
    );
});
