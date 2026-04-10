import Joi from 'joi';

export const selectPlanSchema = Joi.object({
    planId: Joi.string().required(),
    country: Joi.string().trim().allow('').optional(),
});

export const changePlanSchema = Joi.object({
    planId: Joi.string().required(),
});
