import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const TicketType = mongoose.model('TicketType', ticketTypeSchema);
export default TicketType;
