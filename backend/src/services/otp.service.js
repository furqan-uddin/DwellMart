import crypto from 'crypto';
import { sendEmail } from './email.service.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const isTruthy = (value) => ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const isMockOTPEnabled = () => process.env.NODE_ENV !== 'production' && isTruthy(process.env.USE_MOCK_OTP);

const getMockOTP = () => {
    const mockOTP = String(process.env.MOCK_OTP || '').trim();
    if (!/^\d{6}$/.test(mockOTP)) {
        throw new Error('MOCK_OTP must be a 6-digit code when USE_MOCK_OTP=true');
    }
    return mockOTP;
};

export const isMockOTP = (otp) => isMockOTPEnabled() && String(otp || '').trim() === getMockOTP();

export const isOTPMatch = (savedOTP, submittedOTP) => (
    isMockOTP(submittedOTP) || String(savedOTP || '') === String(submittedOTP || '').trim()
);

/**
 * Generates a 6-digit OTP and sets expiry (10 minutes)
 * @param {Object} user - Mongoose user/vendor document
 * @param {string} type - Purpose label (for logging)
 */
export const sendOTP = async (user, type = 'verification') => {
    const useMockOTP = isMockOTPEnabled();
    const otp = useMockOTP ? getMockOTP() : crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    if (useMockOTP) {
        console.log(`[OTP] Mock ${type} OTP enabled for ${user.email}.`);
        return otp;
    }

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your verification code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        // Keep auth flow working in environments where SMTP is not configured.
        console.warn(`[OTP] Email send failed for ${user.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[OTP] ${type} OTP generated for ${user.email}`);
        }
    }

    return otp;
};
