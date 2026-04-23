import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import {
    fetchIntegrationOrders,
    fetchIntegrationOrderById,
    fetchIntegrationOrderDetails,
    updateIntegrationOrderDeliveryStatus,
    updateIntegrationInventoryAfterDelivery,
} from '../controllers/integration.controller.js';
import { partnerAuth } from '../middlewares/partnerAuth.middleware.js';
import {
    integrationReadRateLimiter,
    integrationWriteRateLimiter,
} from '../middlewares/integrationRateLimit.middleware.js';
import { integrationAuditLogger } from '../middlewares/integrationAudit.middleware.js';
import {
    integrationOrdersQuerySchema,
    orderIdParamSchema,
    updateDeliveryStatusSchema,
    inventoryUpdateSchema,
} from '../validators/integration.validator.js';

const router = Router();

router.use(integrationAuditLogger);

router.get(
    '/orders',
    integrationReadRateLimiter,
    partnerAuth(['orders:read']),
    validate(integrationOrdersQuerySchema, 'query'),
    fetchIntegrationOrders
);

router.get(
    '/orders/:orderId',
    integrationReadRateLimiter,
    partnerAuth(['orders:read']),
    validate(orderIdParamSchema, 'params'),
    fetchIntegrationOrderById
);

router.get(
    '/order-details/:orderId',
    integrationReadRateLimiter,
    partnerAuth(['orders:read']),
    validate(orderIdParamSchema, 'params'),
    fetchIntegrationOrderDetails
);

router.post(
    '/orders/:orderId/delivery-status',
    integrationWriteRateLimiter,
    partnerAuth(['orders:write']),
    validate(orderIdParamSchema, 'params'),
    validate(updateDeliveryStatusSchema),
    updateIntegrationOrderDeliveryStatus
);

router.post(
    '/inventory/update',
    integrationWriteRateLimiter,
    partnerAuth(['inventory:write']),
    validate(inventoryUpdateSchema),
    updateIntegrationInventoryAfterDelivery
);

export default router;
