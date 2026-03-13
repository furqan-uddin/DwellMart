import Joi from 'joi';

const objectId = Joi.string().trim().hex().length(24);

export const marketingIdParamSchema = Joi.object({
    id: objectId.required(),
});

export const campaignListQuerySchema = Joi.object({
    status: Joi.string().trim().allow('').optional(),
    type: Joi.string().trim().allow('').optional(),
});

