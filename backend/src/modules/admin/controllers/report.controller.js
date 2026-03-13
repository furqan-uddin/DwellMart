import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import Order from '../../../models/Order.model.js';
import Product from '../../../models/Product.model.js';

// GET /api/admin/reports/sales
export const getSalesReport = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status = 'delivered',
        startDate,
        endDate,
        search
    } = req.query;

    const numericPage = Number.parseInt(page, 10) || 1;
    const numericLimit = Number.parseInt(limit, 10) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const filter = { isDeleted: { $ne: true } };
    if (status && status !== 'all') filter.status = status;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [
            { orderId: regex },
            { 'shippingAddress.name': regex },
            { 'shippingAddress.email': regex },
        ];
    }

    const [orders, total, totalsAgg] = await Promise.all([
        Order.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Order.countDocuments(filter),
        Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: { $ifNull: ['$total', 0] } },
                    totalOrders: { $sum: 1 },
                },
            },
        ]),
    ]);

    const totals = totalsAgg?.[0] || { totalSales: 0, totalOrders: 0 };
    const summary = {
        totalSales: Number(totals.totalSales) || 0,
        totalOrders: Number(totals.totalOrders) || 0,
        averageOrderValue:
            (Number(totals.totalOrders) || 0) > 0
                ? (Number(totals.totalSales) || 0) / Number(totals.totalOrders)
                : 0,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                total,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
                summary,
            },
            'Sales report fetched.'
        )
    );
});

// GET /api/admin/reports/inventory
export const getInventoryReport = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, status } = req.query;
    const numericPage = Number.parseInt(page, 10) || 1;
    const numericLimit = Number.parseInt(limit, 10) || 50;
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (status && status !== 'all') filter.stock = status;

    const [products, total, summaryAgg] = await Promise.all([
        Product.find(filter)
            .populate('categoryId', 'name')
            .populate('brandId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
        Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    activeProducts: {
                        $sum: {
                            $cond: [{ $ne: ['$isActive', false] }, 1, 0]
                        }
                    },
                    lowStock: {
                        $sum: {
                            $cond: [{ $eq: ['$stock', 'low_stock'] }, 1, 0]
                        }
                    },
                    outOfStock: {
                        $sum: {
                            $cond: [{ $eq: ['$stock', 'out_of_stock'] }, 1, 0]
                        }
                    },
                    totalValue: {
                        $sum: {
                            $multiply: [
                                { $ifNull: ['$price', 0] },
                                { $ifNull: ['$stockQuantity', 0] },
                            ]
                        }
                    },
                }
            }
        ]),
    ]);

    const aggregated = summaryAgg?.[0] || {};
    const summary = {
        totalProducts: Number(aggregated.totalProducts) || 0,
        activeProducts: Number(aggregated.activeProducts) || 0,
        lowStock: Number(aggregated.lowStock) || 0,
        outOfStock: Number(aggregated.outOfStock) || 0,
        totalValue: Number(aggregated.totalValue) || 0,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                total,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
                summary,
            },
            'Inventory report fetched.'
        )
    );
});
