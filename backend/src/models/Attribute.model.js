import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['size', 'color', 'material', 'custom'], default: 'custom' },
        values: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' }],
    },
    { timestamps: true }
);

const Attribute = mongoose.model('Attribute', attributeSchema);
export default Attribute;
