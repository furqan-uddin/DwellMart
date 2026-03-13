import 'dotenv/config';
import mongoose from 'mongoose';
import Vendor from '../models/Vendor.model.js';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

const seedVendor = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'fashionhub@example.com';
    const existing = await Vendor.findOne({ email }).select('+password');

    if (existing) {
      existing.name = 'Fashion Hub';
      existing.storeName = existing.storeName || 'Fashion Hub Store';
      existing.phone = existing.phone || '+1234567890';
      existing.password = 'vendor123';
      existing.status = 'approved';
      existing.isVerified = true;
      existing.commissionRate = 10;
      await existing.save();
      console.log('Vendor credentials updated: fashionhub@example.com / vendor123');
    } else {
      await Vendor.create({
        name: 'Fashion Hub',
        email,
        password: 'vendor123',
        phone: '+1234567890',
        storeName: 'Fashion Hub Store',
        storeDescription: 'Seeded vendor account',
        status: 'approved',
        isVerified: true,
        commissionRate: 10,
      });
      console.log('Vendor created: fashionhub@example.com / vendor123');
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedVendor();
