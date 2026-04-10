import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Vendor from '../../../models/Vendor.model.js';
import Admin from '../../../models/Admin.model.js';
import SubscriptionPlan from '../../../models/SubscriptionPlan.model.js';
import VendorSubscription from '../../../models/VendorSubscription.model.js';
import { generateTokens } from '../../../utils/generateToken.js';
import { sendOTP } from '../../../services/otp.service.js';
import { createNotification } from '../../../services/notification.service.js';
import { sendEmail } from '../../../services/email.service.js';
import {
    clearRefreshSession,
    decodeRefreshTokenOrThrow,
    persistRefreshSession,
    rotateRefreshSession,
} from '../../../services/refreshToken.service.js';
import fs from 'fs';
import path from 'path';
import { uploadLocalFileToCloudinaryAndCleanup } from '../../../services/upload.service.js';

import { verifySubscriptionPayment } from './razorpay.controller.js';
import { verifyStripePayment } from './stripe.controller.js';

const getVendorOnboardingState = async (vendor) => {
    if (!vendor) {
        return { onboardingStatus: 'not_found', nextStep: 'register' };
    }

    if (!vendor.isVerified) {
        return { onboardingStatus: 'registered', nextStep: 'verify_email' };
    }

    const completedSubscription = await VendorSubscription.findOne({
        vendorId: vendor._id,
        paymentStatus: 'completed',
    })
        .sort({ createdAt: -1 })
        .lean();

    if (!vendor.selectedPlanId) {
        return { onboardingStatus: 'email_verified', nextStep: 'choose_plan' };
    }

    if (!completedSubscription && vendor.onboardingStatus !== 'plan_completed') {
        return { onboardingStatus: 'plan_selected', nextStep: 'complete_payment' };
    }

    if (vendor.status === 'approved') {
        return { onboardingStatus: 'plan_completed', nextStep: 'approved' };
    }

    if (vendor.status === 'rejected') {
        return { onboardingStatus: 'plan_completed', nextStep: 'rejected' };
    }

    if (vendor.status === 'suspended') {
        return { onboardingStatus: 'plan_completed', nextStep: 'suspended' };
    }

    return { onboardingStatus: 'plan_completed', nextStep: 'awaiting_admin_approval' };
};

const createVendorOnboardingSubscription = async ({
    vendor,
    plan,
    payment_method,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    stripe_session_id,
}) => {
    if (plan.price > 0 && !plan.isTrial) {
        if (payment_method === 'razorpay') {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                throw new ApiError(400, 'Razorpay payment details are missing.');
            }
            const isPaymentValid = verifySubscriptionPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!isPaymentValid) throw new ApiError(400, 'Razorpay verification failed.');
        } else if (payment_method === 'stripe') {
            if (!stripe_session_id) {
                throw new ApiError(400, 'Stripe session ID is missing.');
            }
            const isPaymentValid = await verifyStripePayment(stripe_session_id);
            if (!isPaymentValid) throw new ApiError(400, 'Stripe verification failed.');
        } else {
            throw new ApiError(400, 'Valid payment method is required for paid plans.');
        }
    }

    const existingActiveSubscription = await VendorSubscription.findOne({
        vendorId: vendor._id,
        status: 'active',
        paymentStatus: 'completed',
        endDate: { $gt: new Date() },
    });
    if (existingActiveSubscription) {
        return existingActiveSubscription;
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const isPaidPlan = plan.price > 0 && !plan.isTrial;

    vendor.selectedPlanId = plan._id;
    vendor.onboardingStatus = 'plan_completed';
    vendor.onboardingCompletedAt = new Date();
    await vendor.save();

    const subscription = await VendorSubscription.create({
        vendorId: vendor._id,
        planId: plan._id,
        startDate: now,
        endDate,
        status: 'active',
        paymentStatus: 'completed',
        paymentDetails: {
            method: isPaidPlan ? (payment_method || 'manual') : 'free',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            stripeSessionId: stripe_session_id,
            confirmedAt: isPaidPlan ? new Date() : undefined,
        },
    });

    const admins = await Admin.find({ isActive: true }).select('_id');
    await Promise.all(
        admins.map((admin) =>
            createNotification({
                recipientId: admin._id,
                recipientType: 'admin',
                title: 'New Vendor Registration',
                message: `${vendor.storeName || vendor.name} has completed onboarding with the "${plan.name}" plan and is awaiting review.`,
                type: 'system',
                data: {
                    vendorId: String(vendor._id),
                    vendorEmail: vendor.email,
                    status: vendor.status,
                    planName: plan.name,
                },
            })
        )
    );

    return subscription;
};

// POST /api/vendor/auth/register
export const register = asyncHandler(async (req, res) => {
    const { 
        name, email, password, phone, storeName, storeDescription,
        address, agreedToTerms, selectedPlanId, documentType,
    } = req.body;

    // Validate T&C agreement
    if (!agreedToTerms) {
        throw new ApiError(400, 'You must agree to the Terms & Conditions to register.');
    }

    const plan = await SubscriptionPlan.findById(selectedPlanId);
    if (!plan || !plan.isActive) {
        throw new ApiError(400, 'Selected subscription plan is not available.');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const existing = await Vendor.findOne({ email: normalizedEmail });
    if (existing) {
        const onboarding = await getVendorOnboardingState(existing);
        if (
            onboarding.nextStep === 'verify_email' ||
            onboarding.nextStep === 'choose_plan' ||
            onboarding.nextStep === 'complete_payment'
        ) {
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {
                        email: existing.email,
                        resume: true,
                        onboardingStatus: onboarding.onboardingStatus,
                        nextStep: onboarding.nextStep,
                    },
                    onboarding.nextStep === 'verify_email'
                        ? 'Account already exists. Please verify your email to continue onboarding.'
                        : onboarding.nextStep === 'complete_payment'
                        ? 'Account already exists. Please complete the final step for your selected plan.'
                        : 'Account already exists. Please complete your plan selection.'
                )
            );
        }
        throw new ApiError(409, 'Email already registered.');
    }

    const file = req.file;
    if (!file) {
        throw new ApiError(400, 'Please upload either your Trade Licence or GST document.');
    }

    let documentUrl = '';
    let documentFileType = '';

    if (file.mimetype.startsWith('image/')) {
        documentFileType = 'image';
        try {
            const uploaded = await uploadLocalFileToCloudinaryAndCleanup(file.path, 'vendor_documents');
            documentUrl = uploaded.secure_url;
        } catch (error) {
            throw new ApiError(500, `Failed to upload ${documentType === 'gst' ? 'GST' : 'trade licence'} image.`);
        }
    } else {
        documentFileType = file.mimetype === 'application/pdf' ? 'pdf' : 'word';
        const docDir = path.resolve(process.cwd(), 'public/uploads/vendor_documents');
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }
        const fileName = file.filename;
        const destPath = path.join(docDir, fileName);
        fs.renameSync(file.path, destPath);
        documentUrl = `/uploads/vendor_documents/${fileName}`;
    }

    const documents = {};
    if (documentType === 'gst') {
        documents.gst = documentUrl;
    } else {
        documents.tradeLicense = {
            url: documentUrl,
            fileType: documentFileType,
        };
    }

    const vendor = await Vendor.create({
        name: String(name || '').trim(),
        email: normalizedEmail,
        password,
        phone: String(phone || '').trim(),
        storeName: String(storeName || '').trim(),
        storeDescription: String(storeDescription || '').trim(),
        address,
        status: 'pending',
        agreedToTerms: true,
        agreedToTermsAt: new Date(),
        onboardingStatus: 'registered',
        selectedPlanId: plan._id,
        documents,
    });

    await sendOTP(vendor, 'vendor_verification');

    res.status(201).json(new ApiResponse(201, { email: vendor.email }, 'Registration submitted. Please verify your email to continue onboarding.'));
});

export const completeOnboarding = asyncHandler(async (req, res) => {
    const {
        email,
        selectedPlanId,
        payment_method,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        stripe_session_id,
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const vendor = await Vendor.findOne({ email: normalizedEmail });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');

    const effectivePlanId = selectedPlanId || vendor.selectedPlanId;
    const plan = await SubscriptionPlan.findById(effectivePlanId);
    if (!plan || !plan.isActive) {
        throw new ApiError(400, 'Selected subscription plan is not available.');
    }

    await createVendorOnboardingSubscription({
        vendor,
        plan,
        payment_method,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        stripe_session_id,
    });

    res.status(200).json(
        new ApiResponse(200, { email: vendor.email, selectedPlanId: String(plan._id) }, 'Onboarding completed. Awaiting admin approval.')
    );
});

export const getOnboardingStatus = asyncHandler(async (req, res) => {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
    const vendor = await Vendor.findOne({ email: normalizedEmail });

    if (!vendor) {
        return res.status(200).json(
            new ApiResponse(200, { email: normalizedEmail, onboardingStatus: 'not_found', nextStep: 'register' }, 'No onboarding found.')
        );
    }

    const onboarding = await getVendorOnboardingState(vendor);
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                email: vendor.email,
                onboardingStatus: onboarding.onboardingStatus,
                nextStep: onboarding.nextStep,
                isVerified: vendor.isVerified,
                status: vendor.status,
                selectedPlanId: vendor.selectedPlanId ? String(vendor.selectedPlanId) : null,
            },
            'Onboarding status fetched.'
        )
    );
});

// POST /api/vendor/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const vendor = await Vendor.findOne({ email }).select('+otp +otpExpiry');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (vendor.otp !== otp) throw new ApiError(400, 'Invalid OTP.');
    if (vendor.otpExpiry < Date.now()) throw new ApiError(400, 'OTP has expired.');

    vendor.isVerified = true;
    vendor.onboardingStatus = 'email_verified';
    vendor.otp = undefined;
    vendor.otpExpiry = undefined;
    await vendor.save();

    const message = vendor.selectedPlanId
        ? 'Email verified. Please complete the final step for your selected plan.'
        : 'Email verified. Please complete your plan selection.';

    res.status(200).json(new ApiResponse(200, { email: vendor.email }, message));
});

// POST /api/vendor/auth/resend-otp
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required.');

    const vendor = await Vendor.findOne({ email });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (vendor.isVerified) throw new ApiError(400, 'Email is already verified.');

    await sendOTP(vendor, 'vendor_verification');
    res.status(200).json(new ApiResponse(200, null, 'OTP resent successfully. Please check your email.'));
});

// POST /api/vendor/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const vendor = await Vendor.findOne({ email: normalizedEmail }).select('+resetOtp +resetOtpExpiry +resetOtpVerified');

    // Keep response generic to avoid account enumeration.
    if (!vendor) {
        return res.status(200).json(
            new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
        );
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    vendor.resetOtp = otp;
    vendor.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    vendor.resetOtpVerified = false;
    await vendor.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            to: vendor.email,
            subject: 'Vendor password reset OTP',
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        console.warn(`[Vendor Forgot Password] Email send failed for ${vendor.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Vendor Forgot Password] Reset OTP generated for ${vendor.email}`);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
    );
});

// POST /api/vendor/auth/verify-reset-otp
export const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const vendor = await Vendor.findOne({ email: normalizedEmail }).select('+resetOtp +resetOtpExpiry +resetOtpVerified');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.resetOtp || !vendor.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (vendor.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');
    if (vendor.resetOtp !== String(otp)) throw new ApiError(400, 'Invalid reset OTP.');

    vendor.resetOtpVerified = true;
    await vendor.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, null, 'Reset OTP verified.'));
});

// POST /api/vendor/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const vendor = await Vendor.findOne({ email: normalizedEmail }).select('+password +resetOtp +resetOtpExpiry +resetOtpVerified');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.resetOtpVerified) throw new ApiError(400, 'Please verify reset OTP first.');
    if (!vendor.resetOtp || !vendor.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (vendor.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');

    vendor.password = password;
    vendor.resetOtp = undefined;
    vendor.resetOtpExpiry = undefined;
    vendor.resetOtpVerified = false;
    vendor.refreshTokenHash = undefined;
    vendor.refreshTokenExpiresAt = undefined;
    await vendor.save();

    return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});

// POST /api/vendor/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email }).select('+password');
    if (!vendor) throw new ApiError(401, 'Invalid credentials.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');
    const onboarding = await getVendorOnboardingState(vendor);
    if (onboarding.nextStep === 'choose_plan') {
        throw new ApiError(403, 'Please complete your vendor onboarding by choosing a subscription plan.');
    }
    if (onboarding.nextStep === 'complete_payment') {
        throw new ApiError(403, 'Please complete your vendor onboarding for your selected plan.');
    }
    if (vendor.status === 'pending') throw new ApiError(403, 'Your account is pending admin approval.');
    if (vendor.status === 'suspended') throw new ApiError(403, `Your account has been suspended. Reason: ${vendor.suspensionReason || 'Contact support.'}`);
    if (vendor.status === 'rejected') throw new ApiError(403, 'Your vendor application was rejected.');

    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

    const { accessToken, refreshToken } = generateTokens({ id: vendor._id, role: 'vendor', email: vendor.email });
    await persistRefreshSession(vendor, refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, vendor: { id: vendor._id, name: vendor.name, storeName: vendor.storeName, email: vendor.email, storeLogo: vendor.storeLogo } }, 'Login successful.'));
});

// POST /api/vendor/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const decoded = decodeRefreshTokenOrThrow(refreshToken);
    const vendor = await Vendor.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt status isVerified suspensionReason');

    if (!vendor) throw new ApiError(401, 'Invalid refresh token.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');
    const onboarding = await getVendorOnboardingState(vendor);
    if (onboarding.nextStep === 'choose_plan') {
        throw new ApiError(403, 'Please complete your vendor onboarding by choosing a subscription plan.');
    }
    if (onboarding.nextStep === 'complete_payment') {
        throw new ApiError(403, 'Please complete your vendor onboarding for your selected plan.');
    }
    if (vendor.status === 'pending') throw new ApiError(403, 'Your account is pending admin approval.');
    if (vendor.status === 'suspended') throw new ApiError(403, `Your account has been suspended. Reason: ${vendor.suspensionReason || 'Contact support.'}`);
    if (vendor.status === 'rejected') throw new ApiError(403, 'Your vendor application was rejected.');

    const tokens = await rotateRefreshSession(
        vendor,
        { id: vendor._id, role: 'vendor', email: vendor.email },
        refreshToken
    );

    return res.status(200).json(new ApiResponse(200, tokens, 'Session refreshed successfully.'));
});

// POST /api/vendor/auth/logout
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            const decoded = decodeRefreshTokenOrThrow(refreshToken);
            const vendor = await Vendor.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt');
            if (vendor?.refreshTokenHash) {
                await clearRefreshSession(vendor);
            }
        } catch {
            // Keep logout idempotent.
        }
    }

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// GET /api/vendor/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, vendor, 'Profile fetched.'));
});

// PUT /api/vendor/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const allowed = [
        'name',
        'phone',
        'storeName',
        'storeDescription',
        'storeLogo',
        'address',
        'shippingEnabled',
        'freeShippingThreshold',
        'defaultShippingRate',
        'shippingMethods',
        'handlingTime',
        'processingTime',
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const vendor = await Vendor.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password -otp -otpExpiry');
    res.status(200).json(new ApiResponse(200, vendor, 'Profile updated.'));
});

// PUT /api/vendor/auth/bank-details
export const updateBankDetails = asyncHandler(async (req, res) => {
    const { accountName, accountNumber, bankName, ifscCode } = req.body;
    if (!accountName && !accountNumber && !bankName && !ifscCode) {
        throw new ApiError(400, 'At least one bank detail field is required.');
    }

    const updates = {};
    if (accountName) updates['bankDetails.accountName'] = accountName;
    if (accountNumber) updates['bankDetails.accountNumber'] = accountNumber;
    if (bankName) updates['bankDetails.bankName'] = bankName;
    if (ifscCode) updates['bankDetails.ifscCode'] = ifscCode;

    const vendor = await Vendor.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
    ).select('-password -otp -otpExpiry');

    res.status(200).json(new ApiResponse(200, vendor, 'Bank details updated.'));
});
