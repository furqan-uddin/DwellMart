import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        designation: {
            type: String,
            trim: true,
            default: '',
        },
        company: {
            type: String,
            trim: true,
            default: '',
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            trim: true,
            default: '',
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

testimonialSchema.index({ isActive: 1, order: 1, createdAt: -1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export { Testimonial };
export default Testimonial;
