import mongoose from 'mongoose';

const vendorShippingZoneSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        countries: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

vendorShippingZoneSchema.index({ vendorId: 1, name: 1 });

const VendorShippingZone = mongoose.model('VendorShippingZone', vendorShippingZoneSchema);
export { VendorShippingZone };
export default VendorShippingZone;
