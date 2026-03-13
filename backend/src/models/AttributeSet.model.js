import mongoose from 'mongoose';

const attributeSetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' }],
    },
    { timestamps: true }
);

const AttributeSet = mongoose.model('AttributeSet', attributeSetSchema);
export default AttributeSet;
