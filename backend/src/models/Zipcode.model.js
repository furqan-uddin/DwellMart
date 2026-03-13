import mongoose from 'mongoose';

const zipcodeSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true },
        cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', index: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Zipcode = mongoose.model('Zipcode', zipcodeSchema);
export default Zipcode;
