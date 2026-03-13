import mongoose from 'mongoose';

const attributeValueSchema = new mongoose.Schema(
    {
        attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true, index: true },
        value: { type: String, required: true },
        colorCode: { type: String }, // for color-type attributes
    },
    { timestamps: true }
);

const AttributeValue = mongoose.model('AttributeValue', attributeValueSchema);
export default AttributeValue;
