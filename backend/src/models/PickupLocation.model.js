import mongoose from 'mongoose';

const pickupLocationSchema = new mongoose.Schema(
    {
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
        name: { type: String, required: true },
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const PickupLocation = mongoose.model('PickupLocation', pickupLocationSchema);
export default PickupLocation;
