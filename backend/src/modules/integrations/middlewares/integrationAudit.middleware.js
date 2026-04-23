import crypto from 'crypto';
import IntegrationAuditLog from '../../../models/IntegrationAuditLog.model.js';

const safePayload = (value) => {
    if (!value || typeof value !== 'object') return value;
    const clone = JSON.parse(JSON.stringify(value));
    if (clone.apiKey) clone.apiKey = '[REDACTED]';
    if (clone.xApiKey) clone.xApiKey = '[REDACTED]';
    if (clone['x-api-key']) clone['x-api-key'] = '[REDACTED]';
    return clone;
};

const resolveActionFromRequest = (req) => {
    if (req.method === 'GET' && req.path === '/orders') return 'FETCH_ORDERS';
    if (req.method === 'GET' && /^\/orders\/[^/]+$/.test(req.path)) return 'FETCH_ORDER';
    if (req.method === 'GET' && /^\/order-details\/[^/]+$/.test(req.path)) return 'FETCH_ORDER_ITEMS';
    if (req.method === 'POST' && /^\/orders\/[^/]+\/delivery-status$/.test(req.path)) return 'UPDATE_DELIVERY_STATUS';
    if (req.method === 'POST' && req.path === '/inventory/update') return 'UPDATE_INVENTORY';
    return 'INTEGRATION_REQUEST';
};

export const integrationAuditLogger = (req, res, next) => {
    const requestId = String(req.headers['x-request-id'] || crypto.randomUUID());
    const startedAt = Date.now();
    req.integrationRequestId = requestId;

    res.on('finish', async () => {
        try {
            const action = res.locals.integrationAuditAction || resolveActionFromRequest(req);
            const durationMs = Date.now() - startedAt;
            const success = res.statusCode < 400;
            const auditDoc = {
                requestId,
                action,
                success,
                statusCode: res.statusCode,
                message: res.locals.integrationAuditMessage || '',
                orderId: res.locals.integrationAuditOrderId || String(req.params?.orderId || req.body?.orderId || '').trim(),
                partnerStatus: res.locals.integrationAuditPartnerStatus || '',
                clientId: String(req.headers['x-client-id'] || '').trim(),
                partnerId: req.integrationPartner?.id || null,
                partnerName: req.integrationPartner?.name || '',
                requestMeta: {
                    method: req.method,
                    path: req.originalUrl,
                    query: safePayload(req.query),
                    params: safePayload(req.params),
                    body: safePayload(req.body),
                    ip: req.ip,
                    userAgent: String(req.headers['user-agent'] || ''),
                    durationMs,
                },
                rawPayload: safePayload(req.body),
            };
            await IntegrationAuditLog.create(auditDoc);

            if (!success) {
                console.warn(
                    `[Integration Audit] ${action} failed (${res.statusCode}) requestId=${requestId}`
                );
            }
        } catch (error) {
            console.warn(`[Integration Audit] Failed to persist log: ${error.message}`);
        }
    });

    return next();
};
