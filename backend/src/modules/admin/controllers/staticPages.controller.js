import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Settings from '../../../models/Settings.model.js';

const ALLOWED_SLUGS = ['about', 'contact', 'terms', 'privacy', 'returns', 'shipping', 'faq', 'partner'];

const slugToKey = (slug) => `page_${slug}`;

// GET /api/admin/pages/:slug  (admin)
// GET /api/pages/:slug        (public — same handler)
export const getPage = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!ALLOWED_SLUGS.includes(slug)) {
        throw new ApiError(404, 'Page not found.');
    }
    const setting = await Settings.findOne({ key: slugToKey(slug) });
    res.status(200).json(new ApiResponse(200, {
        slug,
        title: setting?.value?.title || '',
        content: setting?.value?.content || '',
        lastUpdated: setting?.updatedAt || null,
    }, 'Page fetched.'));
});

// PUT /api/admin/pages/:slug  (admin only)
export const updatePage = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!ALLOWED_SLUGS.includes(slug)) {
        throw new ApiError(404, 'Page not found.');
    }
    const { title, content } = req.body;
    if (!content || !String(content).trim()) {
        throw new ApiError(400, 'Page content is required.');
    }

    const key = slugToKey(slug);
    const setting = await Settings.findOneAndUpdate(
        { key },
        { key, value: { title: String(title || '').trim(), content: String(content).trim() } },
        { upsert: true, new: true }
    );

    res.status(200).json(new ApiResponse(200, {
        slug,
        title: setting.value.title,
        content: setting.value.content,
        lastUpdated: setting.updatedAt,
    }, 'Page updated successfully.'));
});
