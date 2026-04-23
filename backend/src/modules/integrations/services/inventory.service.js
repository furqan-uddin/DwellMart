import mongoose from 'mongoose';
import Product from '../../../models/Product.model.js';
import Order from '../../../models/Order.model.js';
import ApiError from '../../../utils/ApiError.js';

const normalizeItemCode = (value = '') => String(value || '').trim().toUpperCase();

const resolveProductItemCode = (productDoc = {}, fallbackProductId = '') => {
    const customCode =
        String(productDoc?.itemCode || '').trim() ||
        String(productDoc?.sku || '').trim() ||
        String(productDoc?.hsnCode || '').trim();
    return customCode || String(fallbackProductId || '');
};

const deduplicateObjectIds = (values = []) => {
    const unique = new Set();
    values.forEach((value) => {
        const normalized = String(value || '').trim();
        if (mongoose.isValidObjectId(normalized)) unique.add(normalized);
    });
    return [...unique];
};

export const getProductCodeByProductId = async (orderItems = []) => {
    const productIds = deduplicateObjectIds(orderItems.map((item) => item?.productId));
    if (!productIds.length) return new Map();

    const products = await Product.find({ _id: { $in: productIds } })
        .select('_id hsnCode itemCode sku')
        .lean();

    const codeByProductId = new Map();
    products.forEach((product) => {
        const productId = String(product?._id || '');
        codeByProductId.set(productId, resolveProductItemCode(product, productId));
    });

    productIds.forEach((productId) => {
        if (!codeByProductId.has(productId)) {
            codeByProductId.set(productId, productId);
        }
    });

    return codeByProductId;
};

const buildExpectedOrderItemMap = ({ orderItems = [], productCodeByProductId }) => {
    const expected = new Map();
    orderItems.forEach((item) => {
        const qty = Number(item?.quantity || 0);
        const productId = String(item?.productId || '');
        if (!productId || qty <= 0) return;
        const code = normalizeItemCode(productCodeByProductId.get(productId) || productId);
        const current = expected.get(code) || 0;
        expected.set(code, current + qty);
    });
    return expected;
};

const buildIncomingPayloadMap = (items = []) => {
    const incoming = new Map();
    items.forEach((item) => {
        const code = normalizeItemCode(item?.itemCode);
        const qty = Number(item?.qty || 0);
        if (!code || qty <= 0) return;
        const current = incoming.get(code) || 0;
        incoming.set(code, current + qty);
    });
    return incoming;
};

export const assertInventoryPayloadMatchesOrder = ({
    order,
    items,
    productCodeByProductId,
}) => {
    const expected = buildExpectedOrderItemMap({
        orderItems: order?.items || [],
        productCodeByProductId,
    });
    const incoming = buildIncomingPayloadMap(items);

    if (!expected.size) {
        throw new ApiError(400, 'Order does not contain any inventory items to process.');
    }

    if (incoming.size !== expected.size) {
        throw new ApiError(
            400,
            'Inventory payload does not match order items. Provide all order item codes with exact quantities.'
        );
    }

    for (const [expectedCode, expectedQty] of expected.entries()) {
        const incomingQty = Number(incoming.get(expectedCode) || 0);
        if (incomingQty !== expectedQty) {
            throw new ApiError(
                400,
                `Inventory qty mismatch for itemCode ${expectedCode}. Expected ${expectedQty}, received ${incomingQty}.`
            );
        }
    }
};

const toInventoryDeductionLines = (orderItems = []) => (
    orderItems
        .map((item) => ({
            productId: String(item?.productId || ''),
            qty: Number(item?.quantity || 0),
            variantKey: String(item?.variantKey || '').trim(),
            itemName: String(item?.name || '').trim(),
        }))
        .filter((item) => mongoose.isValidObjectId(item.productId) && item.qty > 0)
);

const deductInventoryLines = async ({ lines, session }) => {
    for (const line of lines) {
        const variantPath = line.variantKey ? `variants.stockMap.${line.variantKey}` : null;
        const filter = {
            _id: line.productId,
            stock: { $ne: 'out_of_stock' },
            stockQuantity: { $gte: line.qty },
        };
        if (variantPath) {
            filter[variantPath] = { $gte: line.qty };
        }

        const update = { $inc: { stockQuantity: -line.qty } };
        if (variantPath) {
            update.$inc[variantPath] = -line.qty;
        }

        const updatedProduct = await Product.findOneAndUpdate(
            filter,
            update,
            { new: true, session }
        );

        if (!updatedProduct) {
            throw new ApiError(
                409,
                `Insufficient stock while processing ${line.itemName || line.productId}.`
            );
        }

        const nextStockState =
            updatedProduct.stockQuantity <= 0
                ? 'out_of_stock'
                : (updatedProduct.stockQuantity <= updatedProduct.lowStockThreshold
                    ? 'low_stock'
                    : 'in_stock');

        await Product.updateOne(
            { _id: updatedProduct._id },
            { $set: { stock: nextStockState } },
            { session }
        );
    }
};

export const applyPostDeliveryInventoryUpdate = async ({ orderId, source = 'delivery_status_callback' }) => {
    let duplicate = false;
    let updatedOrder = null;
    const now = new Date();
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const order = await Order.findOne({
                orderId,
                isDeleted: { $ne: true },
            }).session(session);

            if (!order) {
                throw new ApiError(404, 'Order not found.');
            }

            const claimedOrder = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    $or: [
                        { 'integration.inventoryUpdatedAfterDelivery': { $exists: false } },
                        { 'integration.inventoryUpdatedAfterDelivery': false },
                    ],
                },
                {
                    $set: {
                        'integration.inventoryUpdatedAfterDelivery': true,
                        'integration.inventoryUpdatedAt': now,
                        'integration.lastPartnerSyncAt': now,
                        'integration.inventoryUpdateSource': source,
                    },
                },
                { new: true, session }
            );

            if (!claimedOrder) {
                duplicate = true;
                return;
            }

            const lines = toInventoryDeductionLines(claimedOrder.items || []);
            if (!lines.length) {
                throw new ApiError(400, 'Order has no items eligible for inventory deduction.');
            }

            await deductInventoryLines({ lines, session });
            updatedOrder = claimedOrder;
        });
    } finally {
        await session.endSession();
    }

    return { duplicate, order: updatedOrder };
};
