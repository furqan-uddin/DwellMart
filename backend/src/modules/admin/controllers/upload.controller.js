import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import {
    uploadLocalFileToCloudinaryAndCleanup,
    cleanupLocalFiles,
} from '../../../services/upload.service.js';

/**
 * @desc    Upload single image to Cloudinary via temp local file
 * @route   POST /api/admin/uploads/image
 * @access  Private (Admin)
 */
export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, 'Image file is required');
    }

    const folder = (req.body?.folder || 'general').toString().trim() || 'general';
    const publicId = req.body?.publicId ? String(req.body.publicId).trim() : undefined;

    try {
        const uploaded = await uploadLocalFileToCloudinaryAndCleanup(req.file.path, folder, publicId);
        return res.status(201).json(
            new ApiResponse(201, uploaded, 'Image uploaded successfully')
        );
    } catch (error) {
        await cleanupLocalFiles([req.file.path]);
        throw error;
    }
});
