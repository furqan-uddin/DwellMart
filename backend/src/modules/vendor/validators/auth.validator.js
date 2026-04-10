import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().trim().required(),
    storeName: Joi.string().trim().min(2).max(100).required(),
    storeDescription: Joi.string().trim().max(500).allow('').optional(),
    selectedPlanId: Joi.string().required().messages({
        'any.required': 'Please select a subscription plan.',
    }),
    documentType: Joi.string().valid('tradeLicense', 'gst').required().messages({
        'any.only': 'Please choose Trade License or GST.',
        'any.required': 'Please choose Trade License or GST.',
    }),
    address: Joi.object({
        street: Joi.string().allow('').optional(),
        city: Joi.string().allow('').optional(),
        state: Joi.string().allow('').optional(),
        zipCode: Joi.string().allow('').optional(),
        country: Joi.string().allow('').optional(),
    }).optional(),
    agreedToTerms: Joi.boolean().valid(true).required().messages({
        'any.only': 'You must agree to the Terms & Conditions.',
        'any.required': 'You must agree to the Terms & Conditions.',
    }),
});

export const completeOnboardingSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    selectedPlanId: Joi.string().optional(),
    payment_method: Joi.string().valid('razorpay', 'stripe').allow(null, '').optional(),
    razorpay_order_id: Joi.string().allow('').optional(),
    razorpay_payment_id: Joi.string().allow('').optional(),
    razorpay_signature: Joi.string().allow('').optional(),
    stripe_session_id: Joi.string().allow('').optional(),
});

export const onboardingStatusSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resendOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
    refreshToken: Joi.string().allow('').optional(),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
});

export const verifyResetOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match password.',
    }),
});
