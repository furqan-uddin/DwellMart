import {
    INTEGRATION_PARTNER_STATUSES,
    INTEGRATION_INVENTORY_UPDATE_MODES,
} from '../../../models/Order.model.js';

const PARTNER_STATUS_SET = new Set(INTEGRATION_PARTNER_STATUSES);
const ORDER_TERMINAL_STATUSES = new Set(['cancelled', 'returned', 'delivered']);

const TRANSITION_RULES = {
    NEW: ['READY_FOR_ASSIGNMENT', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'CANCELLED', 'DELIVERED'],
    READY_FOR_ASSIGNMENT: ['NEW', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'CANCELLED', 'DELIVERED'],
    ASSIGNED: ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'CANCELLED', 'DELIVERED'],
    PICKED_UP: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'CANCELLED', 'DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'CANCELLED'],
    DELIVERY_FAILED: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED', 'DELIVERED'],
    CANCELLED: [],
    DELIVERED: [],
};

const normalizeStatus = (value) => String(value || '').trim().toUpperCase();

export const normalizePartnerStatus = (value) => normalizeStatus(value);

export const isValidPartnerStatus = (value) => PARTNER_STATUS_SET.has(normalizePartnerStatus(value));

export const derivePartnerStatusFromOrder = (order = {}) => {
    const explicit = normalizePartnerStatus(order?.integration?.partnerStatus);
    if (isValidPartnerStatus(explicit)) return explicit;

    const orderStatus = String(order?.status || '').trim().toLowerCase();
    if (orderStatus === 'delivered') return 'DELIVERED';
    if (orderStatus === 'cancelled' || orderStatus === 'returned') return 'CANCELLED';
    return 'READY_FOR_ASSIGNMENT';
};

export const validatePartnerStatusTransition = ({ currentStatus, nextStatus, orderStatus }) => {
    const normalizedCurrent = normalizePartnerStatus(currentStatus) || 'READY_FOR_ASSIGNMENT';
    const normalizedNext = normalizePartnerStatus(nextStatus);
    const normalizedOrderStatus = String(orderStatus || '').trim().toLowerCase();

    if (!isValidPartnerStatus(normalizedNext)) {
        return { allowed: false, reason: `Invalid partner status: ${nextStatus}.` };
    }

    if (normalizedCurrent === normalizedNext) {
        return { allowed: true, duplicate: true };
    }

    if (normalizedOrderStatus === 'delivered') {
        return {
            allowed: false,
            reason: 'Order is already delivered and cannot transition to another status.',
        };
    }

    if (ORDER_TERMINAL_STATUSES.has(normalizedOrderStatus) && normalizedNext !== 'CANCELLED') {
        return {
            allowed: false,
            reason: `Order is ${normalizedOrderStatus} and cannot move to ${normalizedNext}.`,
        };
    }

    const allowedTargets = TRANSITION_RULES[normalizedCurrent] || [];
    if (!allowedTargets.includes(normalizedNext)) {
        return {
            allowed: false,
            reason: `Cannot transition partner status from ${normalizedCurrent} to ${normalizedNext}.`,
        };
    }

    return { allowed: true, duplicate: false };
};

export const normalizeInventoryUpdateMode = (value) => {
    const normalized = String(value || '').trim().toUpperCase();
    if (INTEGRATION_INVENTORY_UPDATE_MODES.includes(normalized)) return normalized;
    return 'AT_ORDER_PLACEMENT';
};

export const shouldUsePostDeliveryInventoryMode = (order = {}) => {
    const configuredMode = normalizeInventoryUpdateMode(order?.integration?.inventoryUpdateMode);
    if (configuredMode === 'POST_DELIVERY') return true;

    const envMode = normalizeInventoryUpdateMode(process.env.INTEGRATION_STOCK_UPDATE_STAGE);
    return envMode === 'POST_DELIVERY';
};
