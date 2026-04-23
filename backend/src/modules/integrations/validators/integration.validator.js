import Joi from 'joi';
import { INTEGRATION_PARTNER_STATUSES } from '../../../models/Order.model.js';

const orderIdPattern = /^[A-Za-z0-9_-]{3,64}$/;
const partnerReferencePattern = /^[A-Za-z0-9._\-/:]{1,100}$/;

const statusQueryValues = [
    ...INTEGRATION_PARTNER_STATUSES.filter((status) => !['DELIVERED', 'CANCELLED'].includes(status)),
    'pending',
    'processing',
    'shipped',
];

export const orderIdParamSchema = Joi.object({
    orderId: Joi.string().trim().pattern(orderIdPattern).required(),
});

export const integrationOrdersQuerySchema = Joi.object({
    status: Joi.string().trim().valid(...statusQueryValues).optional(),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(50),
}).custom((value, helpers) => {
    if (value.fromDate && value.toDate && new Date(value.fromDate) > new Date(value.toDate)) {
        return helpers.error('any.invalid', { message: 'fromDate must be less than or equal to toDate.' });
    }
    return value;
}).messages({
    'any.invalid': '{{#message}}',
});

export const updateDeliveryStatusSchema = Joi.object({
    status: Joi.string().trim().valid(...INTEGRATION_PARTNER_STATUSES).required(),
    timestamp: Joi.date().iso().optional(),
    note: Joi.string().trim().max(500).allow('').optional(),
    partnerReferenceId: Joi.string().trim().pattern(partnerReferencePattern).max(100).optional(),
});

export const inventoryUpdateSchema = Joi.object({
    orderId: Joi.string().trim().pattern(orderIdPattern).required(),
    items: Joi.array().items(
        Joi.object({
            itemCode: Joi.string().trim().min(1).max(120).required(),
            qty: Joi.number().integer().min(1).required(),
        }).required()
    ).min(1).required(),
});
