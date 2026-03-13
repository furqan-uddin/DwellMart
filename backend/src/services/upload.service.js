import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';

/**
 * Upload a local image file to Cloudinary
 * @param {string} localFilePath - Temporary local file path from multer disk storage
 * @param {string} folder - Cloudinary folder (e.g. 'products', 'vendors/logos')
 * @param {string} [publicId] - Optional custom public ID
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = async (localFilePath, folder, publicId) => {
    const uploadOptions = { folder, resource_type: 'image' };
    if (publicId) uploadOptions.public_id = publicId;

    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);
    return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Upload a local file to Cloudinary with configurable resource type.
 * Useful for non-image assets like PDFs.
 * @param {string} localFilePath
 * @param {string} folder
 * @param {'image'|'raw'|'auto'} [resourceType='auto']
 * @param {string} [publicId]
 */
export const uploadFileToCloudinary = async (
    localFilePath,
    folder,
    resourceType = 'auto',
    publicId
) => {
    const uploadOptions = { folder, resource_type: resourceType };
    if (publicId) uploadOptions.public_id = publicId;
    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);
    return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Upload local file to Cloudinary and remove the local temp file.
 * Local file deletion happens only after successful Cloudinary upload.
 */
export const uploadLocalFileToCloudinaryAndCleanup = async (localFilePath, folder, publicId) => {
    const uploaded = await uploadToCloudinary(localFilePath, folder, publicId);
    try {
        await fs.unlink(localFilePath);
    } catch {
        // Non-fatal: do not fail the request if temp cleanup fails.
    }
    return uploaded;
};

/**
 * Upload local file to Cloudinary with configurable resource type and cleanup temp file.
 */
export const uploadLocalFileToCloudinaryAndCleanupWithType = async (
    localFilePath,
    folder,
    resourceType = 'auto',
    publicId
) => {
    const uploaded = await uploadFileToCloudinary(
        localFilePath,
        folder,
        resourceType,
        publicId
    );
    try {
        await fs.unlink(localFilePath);
    } catch {
        // Non-fatal: do not fail the request if temp cleanup fails.
    }
    return uploaded;
};

/**
 * Delete a file from Cloudinary by public ID
 */
export const deleteFromCloudinary = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

/**
 * Best-effort local file cleanup helper.
 */
export const cleanupLocalFile = async (localFilePath) => {
    if (!localFilePath) return false;
    try {
        await fs.unlink(localFilePath);
        return true;
    } catch {
        return false;
    }
};

/**
 * Best-effort cleanup for multiple local files.
 */
export const cleanupLocalFiles = async (paths = []) => {
    const uniquePaths = [...new Set((paths || []).filter(Boolean))];
    await Promise.allSettled(uniquePaths.map((filePath) => cleanupLocalFile(filePath)));
};
