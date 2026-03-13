import mongoose from 'mongoose';
import Review from '../models/Review.model.js';
import Product from '../models/Product.model.js';
import Vendor from '../models/Vendor.model.js';

const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (mongoose.Types.ObjectId.isValid(String(value))) {
        return new mongoose.Types.ObjectId(String(value));
    }
    return null;
};

const round2 = (value) => Number(Number(value || 0).toFixed(2));

const buildApprovedReviewMatch = (base = {}) => ({
    ...base,
    isApproved: true,
    isHidden: { $ne: true },
});

export const syncProductAndVendorReviewStats = async (productId) => {
    const resolvedProductId = toObjectId(productId);
    if (!resolvedProductId) return;

    const product = await Product.findById(resolvedProductId).select('_id vendorId').lean();
    if (!product) return;

    const [productStats] = await Review.aggregate([
        { $match: buildApprovedReviewMatch({ productId: resolvedProductId }) },
        {
            $group: {
                _id: null,
                reviewCount: { $sum: 1 },
                averageRating: { $avg: '$rating' },
            },
        },
    ]);

    await Product.updateOne(
        { _id: resolvedProductId },
        {
            $set: {
                reviewCount: Number(productStats?.reviewCount || 0),
                rating: round2(productStats?.averageRating || 0),
            },
        }
    );

    const resolvedVendorId = toObjectId(product.vendorId);
    if (!resolvedVendorId) return;

    const vendorProductIds = await Product.find({ vendorId: resolvedVendorId })
        .select('_id')
        .lean();
    const productIds = vendorProductIds.map((entry) => entry._id).filter(Boolean);

    if (productIds.length === 0) {
        await Vendor.updateOne(
            { _id: resolvedVendorId },
            { $set: { reviewCount: 0, rating: 0 } }
        );
        return;
    }

    const [vendorStats] = await Review.aggregate([
        {
            $match: buildApprovedReviewMatch({
                productId: { $in: productIds },
            }),
        },
        {
            $group: {
                _id: null,
                reviewCount: { $sum: 1 },
                averageRating: { $avg: '$rating' },
            },
        },
    ]);

    await Vendor.updateOne(
        { _id: resolvedVendorId },
        {
            $set: {
                reviewCount: Number(vendorStats?.reviewCount || 0),
                rating: round2(vendorStats?.averageRating || 0),
            },
        }
    );
};

