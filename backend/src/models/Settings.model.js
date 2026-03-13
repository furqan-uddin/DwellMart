import mongoose from 'mongoose';

// Stores all admin-configurable settings as key-value pairs
// e.g. key: 'general', value: { storeName, currency, ... }
const settingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
