import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Settings from '../../../models/Settings.model.js';

const TERMS_KEY = 'vendor_terms_and_conditions';

// GET /api/admin/settings/vendor-terms
export const getVendorTerms = asyncHandler(async (req, res) => {
    const setting = await Settings.findOne({ key: TERMS_KEY });
    res.status(200).json(new ApiResponse(200, {
        content: setting?.value?.content || '',
        lastUpdated: setting?.updatedAt || null,
    }, 'Vendor terms fetched.'));
});

// PUT /api/admin/settings/vendor-terms
export const updateVendorTerms = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || !String(content).trim()) {
        throw new ApiError(400, 'Terms content is required.');
    }

    const setting = await Settings.findOneAndUpdate(
        { key: TERMS_KEY },
        { key: TERMS_KEY, value: { content: String(content).trim() } },
        { upsert: true, new: true }
    );

    res.status(200).json(new ApiResponse(200, {
        content: setting.value.content,
        lastUpdated: setting.updatedAt,
    }, 'Vendor terms updated.'));
});
