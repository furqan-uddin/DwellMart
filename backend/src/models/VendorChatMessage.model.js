import mongoose from 'mongoose';

const vendorChatMessageSchema = new mongoose.Schema(
    {
        threadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorChatThread',
            required: true,
            index: true,
        },
        senderType: {
            type: String,
            enum: ['vendor', 'customer', 'system'],
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        message: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

vendorChatMessageSchema.index({ threadId: 1, createdAt: 1 });

const VendorChatMessage = mongoose.model('VendorChatMessage', vendorChatMessageSchema);
export { VendorChatMessage };
export default VendorChatMessage;
