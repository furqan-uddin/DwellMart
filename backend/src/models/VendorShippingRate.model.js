import mongoose from 'mongoose';

const vendorShippingRateSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorShippingZone',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        freeShippingThreshold: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

vendorShippingRateSchema.index({ vendorId: 1, zoneId: 1, name: 1 });

const VendorShippingRate = mongoose.model('VendorShippingRate', vendorShippingRateSchema);
export { VendorShippingRate };
export default VendorShippingRate;
