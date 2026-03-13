import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import Brand from '../models/Brand.model.js';
import Vendor from '../models/Vendor.model.js';
import Coupon from '../models/Coupon.model.js';
import Banner from '../models/Banner.model.js';
import Campaign from '../models/Campaign.model.js';
import { calculateVendorShippingForGroups } from '../services/vendorShipping.service.js';
import { cacheResponse } from '../middlewares/responseCache.js';

const router = Router();
const listCache = cacheResponse({ ttlSeconds: 30, maxEntries: 1000 });
const detailCache = cacheResponse({ ttlSeconds: 60, maxEntries: 1000 });
const catalogCache = cacheResponse({ ttlSeconds: 300, maxEntries: 200 });
const marketingCache = cacheResponse({ ttlSeconds: 120, maxEntries: 300 });
const PRODUCT_LIST_SELECT = '-faqs -relatedProducts -__v';
const EXCLUSIVE_SALE_CAMPAIGN_TYPES = ['flash_sale', 'daily_deal', 'special_offer', 'festival'];

const toPublicVendor = (vendorDoc) => {
    const vendor = typeof vendorDoc?.toObject === 'function'
        ? vendorDoc.toObject()
        : (vendorDoc || {});

    return {
        ...vendor,
        password: undefined,
        otp: undefined,
        otpExpiry: undefined,
        bankDetails: undefined,
        commissionRate: undefined,
    };
};

const normalizeVariantPart = (value) => String(value || '').trim().toLowerCase();
const normalizeVariantKey = (key) => String(key || '').trim().toLowerCase();

const toVariantPriceEntries = (variantPrices) => {
    if (!variantPrices) return [];
    if (variantPrices instanceof Map) return Array.from(variantPrices.entries());
    if (typeof variantPrices === 'object') return Object.entries(variantPrices);
    return [];
};

const resolveVariantPrice = (product, selectedVariant) => {
    const basePrice = Number(product?.price);
    if (!Number.isFinite(basePrice) || basePrice < 0) return 0;

    const selectionEntries = Object.entries(selectedVariant || {})
        .map(([axis, value]) => [String(axis || '').trim(), String(value || '').trim()])
        .filter(([axis, value]) => axis && value);

    const dynamicKey = selectionEntries.length
        ? selectionEntries
            .map(([axis, value]) => `${normalizeVariantPart(axis)}=${normalizeVariantPart(value)}`)
            .sort()
            .join('|')
        : '';

    const size = normalizeVariantPart(selectedVariant?.size);
    const color = normalizeVariantPart(selectedVariant?.color);
    const entries = toVariantPriceEntries(product?.variants?.prices);
    if (!entries.length || (!dynamicKey && !size && !color)) return basePrice;

    const candidateKeys = [
        dynamicKey || null,
        `${size}|${color}`,
        `${size}-${color}`,
        `${size}_${color}`,
        `${size}:${color}`,
        size && !color ? size : null,
        color && !size ? color : null,
    ].filter(Boolean);

    for (const candidate of candidateKeys) {
        if (!candidate) continue;
        const exact = entries.find(([rawKey]) => String(rawKey).trim() === candidate);
        if (exact) {
            const price = Number(exact[1]);
            if (Number.isFinite(price) && price >= 0) return price;
        }

        const normalized = entries.find(
            ([rawKey]) => normalizeVariantKey(rawKey) === normalizeVariantKey(candidate)
        );
        if (normalized) {
            const price = Number(normalized[1]);
            if (Number.isFinite(price) && price >= 0) return price;
        }
    }

    return basePrice;
};

const activeCampaignWindowQuery = (now = new Date()) => ({
    isActive: true,
    $and: [
        { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }
    ]
});

const collectCampaignProductIds = (campaigns = []) => {
    const idSet = new Set();
    campaigns.forEach((campaign) => {
        const ids = Array.isArray(campaign?.productIds) ? campaign.productIds : [];
        ids.forEach((value) => {
            const normalized = String(value || '').trim();
            if (/^[a-fA-F0-9]{24}$/.test(normalized)) {
                idSet.add(normalized);
            }
        });
    });
    return [...idSet];
};

const getActiveSaleProductIds = async (type = null) => {
    const now = new Date();
    const query = {
        ...activeCampaignWindowQuery(now),
        type: type
            ? String(type || '').trim()
            : { $in: EXCLUSIVE_SALE_CAMPAIGN_TYPES },
    };

    const campaigns = await Campaign.find(query)
        .select('productIds')
        .lean();

    return collectCampaignProductIds(campaigns);
};

// GET /api/products — list with filters
const listProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        category,
        brand,
        vendor,
        search,
        q,
        sort = 'newest',
        flashSale,
        isNewArrival,
        minPrice,
        maxPrice,
        minRating
    } = req.query;
    const numericPage = Math.max(Number(page) || 1, 1);
    const numericLimit = Math.min(Math.max(Number(limit) || 12, 1), 100);
    const skip = (numericPage - 1) * numericLimit;
    const filter = { isActive: true };

    if (category) {
        const categoryId = String(category);
        const childCategories = await Category.find({ parentId: categoryId }).select('_id').lean();
        const categoryIds = [categoryId, ...childCategories.map((cat) => String(cat._id))];
        filter.categoryId = { $in: categoryIds };
    }
    if (brand) filter.brandId = brand;
    if (vendor) filter.vendorId = vendor;
    if (flashSale === 'true') filter.flashSale = true;
    if (isNewArrival === 'true') filter.isNewArrival = true;
    if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
    if (minRating) filter.rating = { $gte: Number(minRating) };
    const searchQuery = String(search || q || '').trim();
    if (searchQuery) filter.$text = { $search: searchQuery };

    const activeSaleProductIds = await getActiveSaleProductIds();
    if (activeSaleProductIds.length) {
        filter._id = { $nin: activeSaleProductIds };
    }

    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, popular: { reviewCount: -1 }, rating: { rating: -1 } };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .select(PRODUCT_LIST_SELECT)
            .populate('categoryId', 'name')
            .populate('brandId', 'name')
            .populate('vendorId', 'storeName')
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { products, total, page: numericPage, pages: Math.ceil(total / numericLimit) }, 'Products fetched.'));
});

router.get('/', listCache, listProducts);
router.get('/products', listCache, listProducts);

// GET /api/products/flash-sale
router.get('/flash-sale', marketingCache, asyncHandler(async (req, res) => {
    const flashSaleProductIds = await getActiveSaleProductIds('flash_sale');
    if (!flashSaleProductIds.length) {
        return res.status(200).json(new ApiResponse(200, [], 'Flash sale products.'));
    }

    const products = await Product.find({ isActive: true, _id: { $in: flashSaleProductIds } })
        .select(PRODUCT_LIST_SELECT)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    res.status(200).json(new ApiResponse(200, products, 'Flash sale products.'));
}));

// GET /api/products/new-arrivals
router.get('/new-arrivals', listCache, asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        sort = 'newest',
        search,
        q,
        minPrice,
        maxPrice,
        minRating,
    } = req.query;

    const numericPage = Math.max(Number(page) || 1, 1);
    const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (numericPage - 1) * numericLimit;

    const filter = { isActive: true, isNewArrival: true };
    const searchQuery = String(search || q || '').trim();
    if (searchQuery) filter.$text = { $search: searchQuery };
    if (minPrice || maxPrice) {
        filter.price = {
            ...(minPrice ? { $gte: Number(minPrice) } : {}),
            ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
        };
    }
    if (minRating) {
        filter.rating = { $gte: Number(minRating) };
    }

    const activeSaleProductIds = await getActiveSaleProductIds();
    if (activeSaleProductIds.length) {
        filter._id = { $nin: activeSaleProductIds };
    }

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        popular: { reviewCount: -1 },
        rating: { rating: -1 },
    };

    const [products, total] = await Promise.all([
        Product.find(filter)
            .select(PRODUCT_LIST_SELECT)
            .populate('categoryId', 'name')
            .populate('brandId', 'name')
            .populate('vendorId', 'storeName')
            .sort(sortMap[sort] || sortMap.newest)
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        products,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit),
    }, 'New arrivals fetched.'));
}));

// GET /api/products/popular
router.get('/popular', marketingCache, asyncHandler(async (req, res) => {
    const activeSaleProductIds = await getActiveSaleProductIds();
    const filter = { isActive: true };
    if (activeSaleProductIds.length) {
        filter._id = { $nin: activeSaleProductIds };
    }

    const products = await Product.find(filter)
        .select(PRODUCT_LIST_SELECT)
        .sort({ reviewCount: -1, rating: -1, createdAt: -1 })
        .limit(10)
        .lean();
    res.status(200).json(new ApiResponse(200, products, 'Popular products.'));
}));

// GET /api/products/similar/:id
router.get('/similar/:id', detailCache, asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).select('_id categoryId').lean();
    if (!product) throw new ApiError(404, 'Product not found.');
    const activeSaleProductIds = await getActiveSaleProductIds();
    const similarFilter = { isActive: true, _id: { $ne: product._id }, categoryId: product.categoryId };
    if (activeSaleProductIds.length) {
        similarFilter._id = { $nin: [String(product._id), ...activeSaleProductIds] };
    }
    const similar = await Product.find(similarFilter)
        .select(PRODUCT_LIST_SELECT)
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    res.status(200).json(new ApiResponse(200, similar, 'Similar products.'));
}));

const getProductDetail = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .populate('vendorId', 'storeName storeLogo rating')
        .lean();
    if (!product) throw new ApiError(404, 'Product not found.');
    res.status(200).json(new ApiResponse(200, product, 'Product detail.'));
});

// GET /api/products/:id
router.get('/products/:id', detailCache, getProductDetail);

// GET /api/categories (public)
router.get('/categories/all', catalogCache, asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();
    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched.'));
}));

// GET /api/brands (public)
router.get('/brands/all', catalogCache, asyncHandler(async (req, res) => {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
    res.status(200).json(new ApiResponse(200, brands, 'Brands fetched.'));
}));

// GET /api/vendors/all (public)
router.get('/vendors/all', detailCache, asyncHandler(async (req, res) => {
    const { status = 'approved', page = 1, limit = 50, search } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.max(parseInt(limit, 10) || 50, 1);
    const skip = (numericPage - 1) * numericLimit;
    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
        const safeRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: safeRegex }, { email: safeRegex }, { storeName: safeRegex }];
    }

    const [vendors, total] = await Promise.all([
        Vendor.find(filter)
            .select('-password -otp -otpExpiry')
            .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Vendor.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        vendors: vendors.map(toPublicVendor),
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Vendors fetched.'));
}));

// GET /api/vendors/:id (public)
router.get('/vendors/:id', detailCache, asyncHandler(async (req, res) => {
    const vendor = await Vendor.findOne({
        _id: req.params.id,
        status: 'approved',
    }).select('-password -otp -otpExpiry').lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, toPublicVendor(vendor), 'Vendor detail fetched.'));
}));

// GET /api/vendors/:id/products (public)
router.get('/vendors/:id/products', listCache, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (numericPage - 1) * numericLimit;

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        popular: { reviewCount: -1 },
        rating: { rating: -1 },
    };

    const vendor = await Vendor.findOne({
        _id: req.params.id,
        status: 'approved',
    }).select('_id').lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const activeSaleProductIds = await getActiveSaleProductIds();
    const filter = { isActive: true, vendorId: req.params.id };
    if (activeSaleProductIds.length) {
        filter._id = { $nin: activeSaleProductIds };
    }
    const [products, total] = await Promise.all([
        Product.find(filter)
            .select(PRODUCT_LIST_SELECT)
            .populate('categoryId', 'name')
            .populate('brandId', 'name')
            .populate('vendorId', 'storeName')
            .sort(sortMap[sort] || { createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        products,
        total,
        page: numericPage,
        pages: Math.ceil(total / numericLimit)
    }, 'Vendor products fetched.'));
}));

// POST /api/coupons/validate
router.post('/coupons/validate', asyncHandler(async (req, res) => {
    const rawCode = String(req.body?.code || '').trim();
    const cartTotal = Number(req.body?.cartTotal);

    if (!rawCode) {
        throw new ApiError(400, 'Coupon code is required.');
    }
    if (!Number.isFinite(cartTotal) || cartTotal < 0) {
        throw new ApiError(400, 'Cart total must be a valid non-negative number.');
    }

    const coupon = await Coupon.findOne({ code: rawCode.toUpperCase(), isActive: true }).lean();
    if (!coupon) throw new ApiError(400, 'Invalid coupon code.');
    if (coupon.startsAt && coupon.startsAt > Date.now()) throw new ApiError(400, 'Coupon is not active yet.');
    if (coupon.expiresAt && coupon.expiresAt < Date.now()) throw new ApiError(400, 'Coupon has expired.');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached.');
    if (cartTotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is Rs.${coupon.minOrderValue}.`);

    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (cartTotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    res.status(200).json(new ApiResponse(200, { coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount }, 'Coupon is valid.'));
}));

// GET /api/coupons/available
router.get('/coupons/available', marketingCache, asyncHandler(async (req, res) => {
    const now = new Date();
    const coupons = await Coupon.find({
        isActive: true,
        $and: [
            { $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
            { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] }
        ]
    })
        .select('code name type value minOrderValue maxDiscount expiresAt usageLimit usedCount')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

    res.status(200).json(new ApiResponse(200, coupons, 'Available coupons fetched.'));
}));

// POST /api/shipping/estimate
router.post('/shipping/estimate', asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const shippingAddress = req.body?.shippingAddress || {};
    const shippingOption = String(req.body?.shippingOption || 'standard');
    const couponType = req.body?.couponType || null;

    if (!items.length) {
        return res.status(200).json(
            new ApiResponse(200, { shipping: 0, byVendor: {} }, 'Shipping estimate calculated.')
        );
    }

    const productIds = items
        .map((item) => String(item?.productId || '').trim())
        .filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
    if (!productIds.length) {
        return res.status(200).json(
            new ApiResponse(200, { shipping: 0, byVendor: {} }, 'Shipping estimate calculated.')
        );
    }

    const products = await Product.find({ _id: { $in: productIds }, isActive: true })
        .populate('vendorId', 'shippingEnabled defaultShippingRate freeShippingThreshold')
        .select('_id vendorId price variants.prices')
        .lean();

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const vendorMap = {};

    items.forEach((item) => {
        const product = productMap.get(String(item?.productId || ''));
        if (!product || !product.vendorId) return;

        const vendorId = String(product.vendorId._id || product.vendorId);
        const quantity = Math.max(1, Number(item?.quantity || 1));
        const price = Math.max(0, Number(resolveVariantPrice(product, item?.variant) || 0));
        const subtotal = price * quantity;

        if (!vendorMap[vendorId]) {
            vendorMap[vendorId] = {
                vendorId,
                subtotal: 0,
                shippingEnabled: product.vendorId.shippingEnabled !== false,
                defaultShippingRate: product.vendorId.defaultShippingRate,
                freeShippingThreshold: product.vendorId.freeShippingThreshold,
            };
        }
        vendorMap[vendorId].subtotal += subtotal;
    });

    const { totalShipping, shippingByVendor } = await calculateVendorShippingForGroups({
        vendorGroups: Object.values(vendorMap),
        shippingAddress,
        shippingOption,
        couponType,
    });

    res.status(200).json(
        new ApiResponse(200, { shipping: totalShipping, byVendor: shippingByVendor }, 'Shipping estimate calculated.')
    );
}));

// GET /api/banners
router.get('/banners', marketingCache, asyncHandler(async (req, res) => {
    const { type } = req.query;
    const now = new Date();
    const filter = {
        isActive: true,
        $and: [
            { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }
        ]
    };
    if (type) filter.type = type;
    const banners = await Banner.find(filter).sort({ order: 1 }).lean();
    res.status(200).json(new ApiResponse(200, banners, 'Banners fetched.'));
}));

// GET /api/campaigns
router.get('/campaigns', marketingCache, asyncHandler(async (req, res) => {
    const { type, limit = 20 } = req.query;
    const parsedLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const now = new Date();

    const query = {
        isActive: true,
        $and: [
            { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] }
        ]
    };
    if (type) query.type = type;

    const campaigns = await Campaign.find(query)
        .select('name slug type route discountType discountValue startDate endDate bannerConfig')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();

    res.status(200).json(new ApiResponse(200, campaigns, 'Campaigns fetched.'));
}));

// GET /api/campaigns/:slug
router.get('/campaigns/:slug', detailCache, asyncHandler(async (req, res) => {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) throw new ApiError(400, 'Campaign slug is required.');

    const campaign = await Campaign.findOne({ slug, isActive: true }).lean();
    if (!campaign) throw new ApiError(404, 'Campaign not found.');

    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
        throw new ApiError(404, 'Campaign is not active yet.');
    }
    if (campaign.endDate && campaign.endDate < now) {
        throw new ApiError(404, 'Campaign has ended.');
    }

    let productIds = Array.isArray(campaign.productIds)
        ? campaign.productIds
            .map((value) => String(value || '').trim())
            .filter((value) => value && /^[a-fA-F0-9]{24}$/.test(value))
        : [];
    if (EXCLUSIVE_SALE_CAMPAIGN_TYPES.includes(String(campaign.type || '').trim())) {
        const activeSaleProductIds = await getActiveSaleProductIds();
        if (activeSaleProductIds.length) {
            const activeSaleSet = new Set(activeSaleProductIds);
            productIds = productIds.filter((id) => activeSaleSet.has(id));
        }
    }

    const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
    })
        .select(PRODUCT_LIST_SELECT)
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .populate('vendorId', 'storeName')
        .sort({ createdAt: -1 })
        .lean();

    const payload = {
        ...campaign,
        id: String(campaign._id),
        products,
    };

    res.status(200).json(new ApiResponse(200, payload, 'Campaign fetched.'));
}));

// GET /api/orders/track/:id (public order tracking)
router.get('/orders/track/:id', detailCache, asyncHandler(async (req, res) => {
    const { default: Order } = await import('../models/Order.model.js');
    const order = await Order.findOne({ orderId: req.params.id })
        .select('orderId status trackingNumber estimatedDelivery deliveredAt createdAt updatedAt cancelledAt')
        .lean();
    if (!order) throw new ApiError(404, 'Order not found.');
    res.status(200).json(new ApiResponse(200, order, 'Order tracking info.'));
}));

// Legacy support: GET /api/:id (only ObjectId-like values to avoid swallowing unknown routes)
router.get('/:id([a-fA-F0-9]{24})', detailCache, getProductDetail);

export default router;
