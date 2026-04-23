import asyncHandler from '../../../utils/asyncHandler.js';
import {
    getIntegrationOrders,
    getIntegrationOrderById,
    getIntegrationOrderDetails,
    updateIntegrationDeliveryStatus,
    updateIntegrationInventory,
} from '../services/integration.service.js';

const sendSuccess = (res, statusCode, payload) => res.status(statusCode).json({ success: true, ...payload });

export const fetchIntegrationOrders = asyncHandler(async (req, res) => {
    const result = await getIntegrationOrders({
        query: req.query,
        partner: req.integrationPartner,
    });
    res.locals.integrationAuditAction = 'FETCH_ORDERS';
    res.locals.integrationAuditMessage = 'Orders fetched successfully';
    sendSuccess(res, 200, {
        message: 'Orders fetched successfully',
        data: result.data,
        pagination: result.pagination,
    });
});

export const fetchIntegrationOrderById = asyncHandler(async (req, res) => {
    const data = await getIntegrationOrderById({
        orderId: req.params.orderId,
        partner: req.integrationPartner,
    });
    res.locals.integrationAuditAction = 'FETCH_ORDER';
    res.locals.integrationAuditOrderId = data.orderId;
    res.locals.integrationAuditMessage = 'Order fetched successfully';
    sendSuccess(res, 200, {
        message: 'Order fetched successfully',
        data,
    });
});

export const fetchIntegrationOrderDetails = asyncHandler(async (req, res) => {
    const data = await getIntegrationOrderDetails({
        orderId: req.params.orderId,
        partner: req.integrationPartner,
    });
    res.locals.integrationAuditAction = 'FETCH_ORDER_ITEMS';
    res.locals.integrationAuditOrderId = req.params.orderId;
    res.locals.integrationAuditMessage = 'Order item details fetched successfully';
    sendSuccess(res, 200, {
        message: 'Order item details fetched successfully',
        data,
    });
});

export const updateIntegrationOrderDeliveryStatus = asyncHandler(async (req, res) => {
    const result = await updateIntegrationDeliveryStatus({
        orderId: req.params.orderId,
        body: req.body,
        partner: req.integrationPartner,
        requestId: req.integrationRequestId,
    });

    res.locals.integrationAuditAction = 'UPDATE_DELIVERY_STATUS';
    res.locals.integrationAuditOrderId = result?.data?.orderId || req.params.orderId;
    res.locals.integrationAuditPartnerStatus = result?.data?.status || req.body?.status;
    res.locals.integrationAuditMessage = result.message;

    sendSuccess(res, 200, {
        message: result.message,
        data: result.data,
    });
});

export const updateIntegrationInventoryAfterDelivery = asyncHandler(async (req, res) => {
    const result = await updateIntegrationInventory({
        orderId: req.body.orderId,
        items: req.body.items,
        requestId: req.integrationRequestId,
    });
    res.locals.integrationAuditAction = 'UPDATE_INVENTORY';
    res.locals.integrationAuditOrderId = result.orderId;
    res.locals.integrationAuditPartnerStatus = result.status;
    res.locals.integrationAuditMessage = 'Inventory updated successfully';
    sendSuccess(res, 200, {
        message: 'Inventory updated successfully',
        data: result,
    });
});
