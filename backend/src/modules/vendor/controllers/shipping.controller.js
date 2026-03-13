import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import VendorShippingZone from '../../../models/VendorShippingZone.model.js';
import VendorShippingRate from '../../../models/VendorShippingRate.model.js';

const sanitizeCountries = (countries) => {
    if (!Array.isArray(countries)) return [];
    return countries
        .map((country) => String(country || '').trim())
        .filter(Boolean);
};

const parseNonNegativeNumber = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new ApiError(400, `${fieldName} must be a non-negative number.`);
    }
    return parsed;
};

export const getShippingZones = asyncHandler(async (req, res) => {
    const zones = await VendorShippingZone.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, zones, 'Shipping zones fetched.'));
});

export const createShippingZone = asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name) throw new ApiError(400, 'Zone name is required.');

    const zone = await VendorShippingZone.create({
        vendorId: req.user.id,
        name,
        countries: sanitizeCountries(req.body?.countries),
    });

    res.status(201).json(new ApiResponse(201, zone, 'Shipping zone created.'));
});

export const updateShippingZone = asyncHandler(async (req, res) => {
    const zone = await VendorShippingZone.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!zone) throw new ApiError(404, 'Shipping zone not found.');

    if (req.body?.name !== undefined) {
        const name = String(req.body.name || '').trim();
        if (!name) throw new ApiError(400, 'Zone name is required.');
        zone.name = name;
    }

    if (req.body?.countries !== undefined) {
        zone.countries = sanitizeCountries(req.body.countries);
    }

    await zone.save();
    res.status(200).json(new ApiResponse(200, zone, 'Shipping zone updated.'));
});

export const deleteShippingZone = asyncHandler(async (req, res) => {
    const zone = await VendorShippingZone.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!zone) throw new ApiError(404, 'Shipping zone not found.');

    await VendorShippingRate.deleteMany({ vendorId: req.user.id, zoneId: zone._id });
    res.status(200).json(new ApiResponse(200, null, 'Shipping zone deleted.'));
});

export const getShippingRates = asyncHandler(async (req, res) => {
    const rates = await VendorShippingRate.find({ vendorId: req.user.id })
        .populate('zoneId', 'name')
        .sort({ createdAt: -1 });

    const mappedRates = rates.map((rateDoc) => {
        const rate = rateDoc.toObject();
        return {
            ...rate,
            zoneName: rate.zoneId?.name || '',
        };
    });

    res.status(200).json(new ApiResponse(200, mappedRates, 'Shipping rates fetched.'));
});

export const createShippingRate = asyncHandler(async (req, res) => {
    const zoneId = String(req.body?.zoneId || '').trim();
    const name = String(req.body?.name || '').trim();
    if (!zoneId || !mongoose.Types.ObjectId.isValid(zoneId)) {
        throw new ApiError(400, 'Valid zone is required.');
    }
    if (!name) throw new ApiError(400, 'Rate method name is required.');

    const zone = await VendorShippingZone.findOne({ _id: zoneId, vendorId: req.user.id });
    if (!zone) throw new ApiError(404, 'Shipping zone not found.');

    const rate = await VendorShippingRate.create({
        vendorId: req.user.id,
        zoneId,
        name,
        rate: parseNonNegativeNumber(req.body?.rate ?? 0, 'Rate'),
        freeShippingThreshold: parseNonNegativeNumber(
            req.body?.freeShippingThreshold ?? 0,
            'Free shipping threshold'
        ),
    });

    const created = await VendorShippingRate.findById(rate._id).populate('zoneId', 'name');
    const payload = created.toObject();
    payload.zoneName = payload.zoneId?.name || '';

    res.status(201).json(new ApiResponse(201, payload, 'Shipping rate created.'));
});

export const updateShippingRate = asyncHandler(async (req, res) => {
    const rate = await VendorShippingRate.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!rate) throw new ApiError(404, 'Shipping rate not found.');

    if (req.body?.zoneId !== undefined) {
        const zoneId = String(req.body.zoneId || '').trim();
        if (!zoneId || !mongoose.Types.ObjectId.isValid(zoneId)) {
            throw new ApiError(400, 'Valid zone is required.');
        }
        const zone = await VendorShippingZone.findOne({ _id: zoneId, vendorId: req.user.id });
        if (!zone) throw new ApiError(404, 'Shipping zone not found.');
        rate.zoneId = zoneId;
    }

    if (req.body?.name !== undefined) {
        const name = String(req.body.name || '').trim();
        if (!name) throw new ApiError(400, 'Rate method name is required.');
        rate.name = name;
    }

    if (req.body?.rate !== undefined) {
        rate.rate = parseNonNegativeNumber(req.body.rate, 'Rate');
    }

    if (req.body?.freeShippingThreshold !== undefined) {
        rate.freeShippingThreshold = parseNonNegativeNumber(
            req.body.freeShippingThreshold,
            'Free shipping threshold'
        );
    }

    await rate.save();

    const updated = await VendorShippingRate.findById(rate._id).populate('zoneId', 'name');
    const payload = updated.toObject();
    payload.zoneName = payload.zoneId?.name || '';

    res.status(200).json(new ApiResponse(200, payload, 'Shipping rate updated.'));
});

export const deleteShippingRate = asyncHandler(async (req, res) => {
    const rate = await VendorShippingRate.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!rate) throw new ApiError(404, 'Shipping rate not found.');

    res.status(200).json(new ApiResponse(200, null, 'Shipping rate deleted.'));
});
