/**
 * Grandfathering Script for Existing Vendors
 * 
 * Run this ONCE after deploying the subscription system to give all existing
 * approved vendors an active subscription so they are not locked out.
 * 
 * Usage: node backend/scripts/grandfatherVendors.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import Vendor from '../src/models/Vendor.model.js';
import SubscriptionPlan from '../src/models/SubscriptionPlan.model.js';
import VendorSubscription from '../src/models/VendorSubscription.model.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const GRANDFATHER_DURATION_DAYS = 365; // 1-year grace period for existing vendors

async function main() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not set in .env');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find or create a "Legacy" subscription plan
    let legacyPlan = await SubscriptionPlan.findOne({ slug: 'legacy-vendor-plan' });
    if (!legacyPlan) {
        legacyPlan = await SubscriptionPlan.create({
            name: 'Legacy Vendor Plan',
            slug: 'legacy-vendor-plan',
            price: 0,
            durationDays: GRANDFATHER_DURATION_DAYS,
            description: 'Auto-assigned to vendors who registered before the subscription system.',
            features: ['Full access', 'Grandfathered plan'],
            isTrial: false,
            isMostPopular: false,
            isActive: false, // Not shown on public page
            sortOrder: 999,
        });
        console.log('✅ Created "Legacy Vendor Plan"');
    }

    // 2. Find all approved vendors without an active subscription
    const approvedVendors = await Vendor.find({ status: 'approved' }).select('_id email storeName').lean();
    console.log(`📋 Found ${approvedVendors.length} approved vendor(s)`);

    let created = 0;
    let skipped = 0;

    for (const vendor of approvedVendors) {
        // Check if vendor already has any subscription
        const existingSub = await VendorSubscription.findOne({ vendorId: vendor._id });
        if (existingSub) {
            skipped++;
            continue;
        }

        const now = new Date();
        await VendorSubscription.create({
            vendorId: vendor._id,
            planId: legacyPlan._id,
            startDate: now,
            endDate: new Date(now.getTime() + GRANDFATHER_DURATION_DAYS * 24 * 60 * 60 * 1000),
            status: 'active',
            paymentStatus: 'completed',
            paymentDetails: {
                method: 'grandfathered',
                notes: 'Auto-assigned during subscription system migration.',
            },
        });

        // Mark vendor as having agreed to terms (since they were already approved)
        await Vendor.updateOne({ _id: vendor._id }, {
            agreedToTerms: true,
            agreedToTermsAt: now,
        });

        created++;
        console.log(`  ✅ ${vendor.storeName || vendor.email} → Legacy plan (${GRANDFATHER_DURATION_DAYS} days)`);
    }

    console.log(`\n🎉 Done! Created ${created} subscription(s), skipped ${skipped} (already had one).`);
    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
