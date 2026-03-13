import mongoose from 'mongoose';

const vendorChatThreadSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        orderRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        orderDisplayId: { type: String, trim: true },
        customerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        customerName: { type: String, default: 'Customer' },
        customerEmail: { type: String, default: '' },
        customerPhone: { type: String, default: '' },
        lastMessage: { type: String, default: '' },
        lastActivity: { type: Date, default: Date.now, index: true },
        unreadCount: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ['active', 'resolved'],
            default: 'active',
            index: true,
        },
    },
    { timestamps: true }
);

vendorChatThreadSchema.index({ vendorId: 1, orderRef: 1 }, { unique: true });

const VendorChatThread = mongoose.model('VendorChatThread', vendorChatThreadSchema);
export { VendorChatThread };
export default VendorChatThread;
