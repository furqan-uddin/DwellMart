import Order from '../../../models/Order.model.js';
import Vendor from '../../../models/Vendor.model.js';
import ApiError from '../../../utils/ApiError.js';
import { mapOrderHeaderForPartner, mapOrderItemsForPartner } from './integration.mapper.js';
import {
    getProductCodeByProductId,
    applyPostDeliveryInventoryUpdate,
    assertInventoryPayloadMatchesOrder,
} from './inventory.service.js';
import {
    derivePartnerStatusFromOrder,
    normalizePartnerStatus,
    validatePartnerStatusTransition,
    shouldUsePostDeliveryInventoryMode,
} from '../utils/integrationStatus.util.js';

const ORDER_TERMINAL_STATUSES = new Set(['cancelled', 'returned', 'delivered']);
const DEFAULT_LIST_LIMIT = 50;
const MAX_INTEGRATION_LOGS = 100;

const toOrderId = (value = '') => String(value || '').trim();

const sanitizeStatusFilter = (value) => String(value || '').trim();

const normalizeToDateUpperBound = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    if (
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0 &&
        date.getUTCMilliseconds() === 0
    ) {
        date.setUTCHours(23, 59, 59, 999);
    }
    return date;
};

const getUniqueVendorIds = (order) => {
    const vendorIds = new Set();
    (order?.vendorItems || []).forEach((group) => {
        const vendorId = String(group?.vendorId || '').trim();
        if (vendorId) vendorIds.add(vendorId);
    });
    (order?.items || []).forEach((item) => {
        const vendorId = String(item?.vendorId || '').trim();
        if (vendorId) vendorIds.add(vendorId);
    });
    return [...vendorIds];
};

const isOrderStructurallyEligible = (order) => {
    if (!order) return { eligible: false, reason: 'Order not found.' };
    if (order?.isDeleted) return { eligible: false, reason: 'Order is inactive.' };
    if (ORDER_TERMINAL_STATUSES.has(String(order?.status || '').toLowerCase())) {
        return { eligible: false, reason: 'Order is not eligible for partner processing.' };
    }
    if (order?.integration?.eligibleForPartner === false) {
        return { eligible: false, reason: 'Order is not marked for partner integration.' };
    }

    const hasItems = Array.isArray(order?.items) && order.items.length > 0;
    if (!hasItems) return { eligible: false, reason: 'Order has no items.' };

    const shippingAddress = order?.shippingAddress || {};
    const hasAddress =
        String(shippingAddress?.address || '').trim() &&
        String(shippingAddress?.country || '').trim() &&
        String(shippingAddress?.state || '').trim();
    if (!hasAddress) return { eligible: false, reason: 'Order shipping address is incomplete.' };

    const hasPhone =
        String(shippingAddress?.phone || '').trim() ||
        String(order?.guestInfo?.phone || '').trim();
    if (!hasPhone) return { eligible: false, reason: 'Order contact phone is missing.' };

    return { eligible: true };
};

const assertApprovedVendorsOrThrow = async (order) => {
    const vendorIds = getUniqueVendorIds(order);
    if (!vendorIds.length) {
        throw new ApiError(409, 'Order has no valid vendor mapping.');
    }

    const approvedCount = await Vendor.countDocuments({
        _id: { $in: vendorIds },
        status: 'approved',
    });
    if (approvedCount !== vendorIds.length) {
        throw new ApiError(409, 'Order includes vendor(s) that are not approved.');
    }
};

const buildBaseEligibilityMatch = () => ({
    isDeleted: { $ne: true },
    status: { $nin: ['cancelled', 'returned', 'delivered'] },
    'integration.eligibleForPartner': { $ne: false },
    'items.0': { $exists: true },
    'shippingAddress.address': { $exists: true, $nin: [null, ''] },
    'shippingAddress.country': { $exists: true, $nin: [null, ''] },
    'shippingAddress.state': { $exists: true, $nin: [null, ''] },
    $and: [
        {
            $or: [
                { 'shippingAddress.phone': { $exists: true, $nin: [null, ''] } },
                { 'guestInfo.phone': { $exists: true, $nin: [null, ''] } },
            ],
        },
    ],
});

const buildOrderListMatch = ({ status, fromDate, toDate }) => {
    const match = buildBaseEligibilityMatch();
    const normalizedStatusFilter = sanitizeStatusFilter(status);

    if (normalizedStatusFilter) {
        const lowercaseStatus = normalizedStatusFilter.toLowerCase();
        if (['pending', 'processing', 'shipped'].includes(lowercaseStatus)) {
            match.status = lowercaseStatus;
        } else if (normalizedStatusFilter.toUpperCase() === 'NEW') {
            match.$and = match.$and || [];
            match.$and.push({
                $or: [
                    { 'integration.partnerStatus': 'NEW' },
                    { 'integration.partnerStatus': 'READY_FOR_ASSIGNMENT' },
                    { 'integration.partnerStatus': { $exists: false } },
                    { 'integration.partnerStatus': null },
                ],
            });
        } else {
            match['integration.partnerStatus'] = normalizedStatusFilter.toUpperCase();
        }
    }

    if (fromDate || toDate) {
        match.createdAt = {};
        if (fromDate) match.createdAt.$gte = new Date(fromDate);
        if (toDate) {
            const upperBound = normalizeToDateUpperBound(toDate);
            if (upperBound) match.createdAt.$lte = upperBound;
        }
    }

    return match;
};

const vendorEligibilityPipelineStages = [
    {
        $addFields: {
            _allVendorIdsRaw: {
                $setUnion: [
                    {
                        $map: {
                            input: { $ifNull: ['$vendorItems', []] },
                            as: 'vendorGroup',
                            in: '$$vendorGroup.vendorId',
                        },
                    },
                    {
                        $map: {
                            input: { $ifNull: ['$items', []] },
                            as: 'item',
                            in: '$$item.vendorId',
                        },
                    },
                ],
            },
        },
    },
    {
        $addFields: {
            _allVendorIds: { $setDifference: ['$_allVendorIdsRaw', [null]] },
            _allVendorCount: { $size: { $setDifference: ['$_allVendorIdsRaw', [null]] } },
        },
    },
    {
        $lookup: {
            from: 'vendors',
            let: { vendorIds: '$_allVendorIds' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $in: ['$_id', '$$vendorIds'] },
                                { $eq: ['$status', 'approved'] },
                            ],
                        },
                    },
                },
                { $project: { _id: 1 } },
            ],
            as: '_eligibleVendors',
        },
    },
    {
        $addFields: {
            _eligibleVendorCount: { $size: '$_eligibleVendors' },
        },
    },
    {
        $match: {
            $expr: {
                $and: [
                    { $gt: ['$_allVendorCount', 0] },
                    { $eq: ['$_eligibleVendorCount', '$_allVendorCount'] },
                ],
            },
        },
    },
];

const listProjection = {
    orderId: 1,
    createdAt: 1,
    paymentMethod: 1,
    shippingAddress: 1,
    guestInfo: 1,
    status: 1,
    integration: 1,
    items: { $slice: ['$items', 1] },
};

const markOrdersExposedToPartner = async ({ orderIds, partnerName }) => {
    if (!orderIds.length) return;
    const now = new Date();

    await Order.updateMany(
        { _id: { $in: orderIds } },
        {
            $set: {
                'integration.lastPartnerSyncAt': now,
                'integration.deliveryPartnerName': partnerName,
            },
        }
    );

    await Order.updateMany(
        {
            _id: { $in: orderIds },
            $or: [
                { 'integration.exposedToPartnerAt': { $exists: false } },
                { 'integration.exposedToPartnerAt': null },
            ],
        },
        {
            $set: {
                'integration.exposedToPartnerAt': now,
                'integration.partnerStatus': 'READY_FOR_ASSIGNMENT',
            },
        }
    );
};

const buildIntegrationLogEntry = ({
    status,
    timestamp,
    note,
    partnerReferenceId,
    requestId,
    rawPayload,
}) => ({
    status,
    timestamp: timestamp || new Date(),
    note: String(note || '').trim(),
    source: 'third_party_api',
    partnerReferenceId: String(partnerReferenceId || '').trim(),
    requestId: String(requestId || '').trim(),
    rawPayload: rawPayload || {},
});

const appendOrderIntegrationLog = async ({ orderId, logEntry, patch = {} }) => {
    const updateDoc = {
        $push: {
            'integration.logs': {
                $each: [logEntry],
                $slice: -MAX_INTEGRATION_LOGS,
            },
        },
    };
    if (patch && Object.keys(patch).length > 0) {
        updateDoc.$set = patch;
    }

    await Order.updateOne(
        { orderId: toOrderId(orderId) },
        updateDoc
    );
};

const appendOrderIntegrationLogOnDoc = ({ order, logEntry }) => {
    if (!order.integration || typeof order.integration !== 'object') {
        order.integration = {};
    }
    const logs = Array.isArray(order.integration.logs) ? order.integration.logs : [];
    logs.push(logEntry);
    order.integration.logs = logs.slice(-MAX_INTEGRATION_LOGS);
};

const findEligibleOrderByOrderId = async (orderId) => {
    const order = await Order.findOne({
        orderId: toOrderId(orderId),
        isDeleted: { $ne: true },
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    const eligibility = isOrderStructurallyEligible(order);
    if (!eligibility.eligible) {
        throw new ApiError(409, eligibility.reason || 'Order is not eligible.');
    }

    await assertApprovedVendorsOrThrow(order);
    return order;
};

export const getIntegrationOrders = async ({ query, partner }) => {
    const numericPage = Math.max(1, Number(query?.page) || 1);
    const numericLimit = Math.min(Math.max(1, Number(query?.limit) || DEFAULT_LIST_LIMIT), 200);
    const skip = (numericPage - 1) * numericLimit;
    const match = buildOrderListMatch({
        status: query?.status,
        fromDate: query?.fromDate,
        toDate: query?.toDate,
    });

    const aggregation = await Order.aggregate([
        { $match: match },
        ...vendorEligibilityPipelineStages,
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: numericLimit },
                    { $project: listProjection },
                ],
                metadata: [{ $count: 'total' }],
            },
        },
    ]);

    const rows = aggregation?.[0]?.data || [];
    const total = Number(aggregation?.[0]?.metadata?.[0]?.total || 0);
    const pages = Math.max(1, Math.ceil(total / numericLimit));

    const orderIds = rows.map((row) => row._id);
    await markOrdersExposedToPartner({
        orderIds,
        partnerName: partner?.name || 'Delivery Partner',
    });

    const data = rows.map((row) => mapOrderHeaderForPartner(row));
    return {
        data,
        pagination: {
            page: numericPage,
            limit: numericLimit,
            total,
            pages,
        },
    };
};

export const getIntegrationOrderById = async ({ orderId, partner }) => {
    const order = await findEligibleOrderByOrderId(orderId);
    await markOrdersExposedToPartner({
        orderIds: [order._id],
        partnerName: partner?.name || 'Delivery Partner',
    });
    return mapOrderHeaderForPartner(order.toObject());
};

export const getIntegrationOrderDetails = async ({ orderId, partner }) => {
    const order = await findEligibleOrderByOrderId(orderId);
    const productCodeByProductId = await getProductCodeByProductId(order.items || []);
    await markOrdersExposedToPartner({
        orderIds: [order._id],
        partnerName: partner?.name || 'Delivery Partner',
    });
    return mapOrderItemsForPartner({
        order: order.toObject(),
        productCodeByProductId,
    });
};

export const updateIntegrationDeliveryStatus = async ({
    orderId,
    body,
    partner,
    requestId,
}) => {
    const normalizedOrderId = toOrderId(orderId);
    const incomingStatus = normalizePartnerStatus(body?.status);
    const eventTimestamp = body?.timestamp ? new Date(body.timestamp) : new Date();
    const note = body?.note || '';
    const partnerReferenceId = body?.partnerReferenceId || '';
    const now = new Date();

    const order = await Order.findOne({
        orderId: normalizedOrderId,
        isDeleted: { $ne: true },
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    const currentPartnerStatus = derivePartnerStatusFromOrder(order);
    const transition = validatePartnerStatusTransition({
        currentStatus: currentPartnerStatus,
        nextStatus: incomingStatus,
        orderStatus: order.status,
    });

    const logEntry = buildIntegrationLogEntry({
        status: incomingStatus,
        timestamp: eventTimestamp,
        note,
        partnerReferenceId,
        requestId,
        rawPayload: body,
    });

    const alreadyDelivered = String(order.status || '').toLowerCase() === 'delivered';
    if (alreadyDelivered && incomingStatus === 'DELIVERED') {
        await appendOrderIntegrationLog({
            orderId: normalizedOrderId,
            logEntry,
            patch: {
                'integration.lastPartnerSyncAt': now,
                'integration.deliveryPartnerName': partner?.name || '',
                ...(partnerReferenceId
                    ? { 'integration.partnerReferenceId': String(partnerReferenceId).trim() }
                    : {}),
            },
        });
        console.log(`[Integration] Duplicate delivered callback ignored for order ${normalizedOrderId}`);
        return {
            duplicate: true,
            message: 'Order already marked as delivered. Duplicate callback ignored.',
            data: { orderId: normalizedOrderId, status: 'DELIVERED' },
        };
    }

    if (!transition.allowed) {
        throw new ApiError(409, transition.reason || 'Invalid delivery status transition.');
    }

    if (transition.duplicate) {
        await appendOrderIntegrationLog({
            orderId: normalizedOrderId,
            logEntry,
            patch: {
                'integration.lastPartnerSyncAt': now,
                'integration.deliveryPartnerName': partner?.name || '',
                ...(partnerReferenceId
                    ? { 'integration.partnerReferenceId': String(partnerReferenceId).trim() }
                    : {}),
            },
        });
        return {
            duplicate: true,
            message: `Duplicate ${incomingStatus} callback ignored.`,
            data: { orderId: normalizedOrderId, status: incomingStatus },
        };
    }

    if (String(order.status || '').toLowerCase() === 'cancelled' && incomingStatus === 'DELIVERED') {
        throw new ApiError(409, 'Cancelled orders cannot be marked as delivered.');
    }

    order.integration = order.integration || {};
    order.integration.partnerStatus = incomingStatus;
    order.integration.lastPartnerSyncAt = now;
    order.integration.deliveryPartnerName = partner?.name || order.integration.deliveryPartnerName || '';
    order.integration.exposedToPartnerAt = order.integration.exposedToPartnerAt || now;
    if (partnerReferenceId) {
        order.integration.partnerReferenceId = String(partnerReferenceId).trim();
    }

    if (incomingStatus === 'DELIVERED') {
        order.status = 'delivered';
        order.deliveredAt = eventTimestamp;
        order.cancelledAt = null;
        order.integration.deliveredAt = eventTimestamp;
        order.vendorItems = (order.vendorItems || []).map((group) => {
            const current = String(group?.status || 'pending');
            if (current === 'cancelled') return group;
            const snapshot = typeof group?.toObject === 'function' ? group.toObject() : group;
            return { ...snapshot, status: 'delivered' };
        });
    }

    appendOrderIntegrationLogOnDoc({ order, logEntry });
    await order.save();
    console.log(
        `[Integration] Delivery status updated for order ${normalizedOrderId} -> ${incomingStatus}`
    );

    let inventoryMessage = 'Inventory update skipped. Stock is managed at order placement.';
    if (incomingStatus === 'DELIVERED' && shouldUsePostDeliveryInventoryMode(order)) {
        const inventoryResult = await applyPostDeliveryInventoryUpdate({
            orderId: normalizedOrderId,
            source: 'delivery_status_callback',
        });
        if (inventoryResult.duplicate) {
            inventoryMessage = 'Inventory was already updated earlier.';
            console.log(`[Integration] Inventory update already completed for order ${normalizedOrderId}`);
        } else {
            inventoryMessage = 'Inventory updated successfully after delivery.';
            console.log(`[Integration] Inventory updated after delivery for order ${normalizedOrderId}`);
        }
    } else if (incomingStatus === 'DELIVERED') {
        console.log(
            `[Integration] Inventory update skipped for order ${normalizedOrderId} (AT_ORDER_PLACEMENT mode)`
        );
    }

    return {
        duplicate: false,
        message: 'Delivery status updated successfully',
        data: {
            orderId: normalizedOrderId,
            status: incomingStatus,
            inventory: inventoryMessage,
        },
    };
};

export const updateIntegrationInventory = async ({ orderId, items, requestId }) => {
    const normalizedOrderId = toOrderId(orderId);
    const order = await Order.findOne({
        orderId: normalizedOrderId,
        isDeleted: { $ne: true },
    });
    if (!order) throw new ApiError(404, 'Order not found.');

    if (String(order.status || '').toLowerCase() !== 'delivered') {
        throw new ApiError(409, 'Inventory can be updated only after order is delivered.');
    }

    if (!shouldUsePostDeliveryInventoryMode(order)) {
        throw new ApiError(
            409,
            'Inventory updates are handled at order placement in current configuration.'
        );
    }

    const productCodeByProductId = await getProductCodeByProductId(order.items || []);
    assertInventoryPayloadMatchesOrder({
        order,
        items,
        productCodeByProductId,
    });

    const inventoryResult = await applyPostDeliveryInventoryUpdate({
        orderId: normalizedOrderId,
        source: 'manual_inventory_api',
    });

    const inventoryLog = buildIntegrationLogEntry({
        status: 'DELIVERED',
        timestamp: new Date(),
        note: 'Manual inventory update endpoint invoked.',
        requestId,
        rawPayload: { orderId: normalizedOrderId, items },
    });

    await appendOrderIntegrationLog({
        orderId: normalizedOrderId,
        logEntry: inventoryLog,
        patch: { 'integration.lastPartnerSyncAt': new Date() },
    });

    if (inventoryResult.duplicate) {
        throw new ApiError(409, 'Duplicate inventory update ignored. Inventory already processed.');
    }

    return {
        orderId: normalizedOrderId,
        status: 'DELIVERED',
        inventoryUpdated: true,
    };
};
