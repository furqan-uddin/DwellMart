import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        otpExpiry: {
            type: Date,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to automatically remove the record after 15 minutes
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
