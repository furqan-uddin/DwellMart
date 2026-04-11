import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import VendorDocument from '../../../models/VendorDocument.model.js';
import {
    uploadLocalFileToCloudinaryAndCleanupWithType,
    deleteFromCloudinary,
    cleanupLocalFiles,
} from '../../../services/upload.service.js';
import { createNotification } from '../../../services/notification.service.js';
import { Admin } from '../../../models/Admin.model.js';
import Vendor from '../../../models/Vendor.model.js';

const ALLOWED_CATEGORIES = new Set([
    'License',
    'Certificate',
    'Tax Document',
    'Other',
]);

export const getVendorDocuments = asyncHandler(async (req, res) => {
    const documents = await VendorDocument.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, documents, 'Documents fetched.'));
});

export const createVendorDocument = asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || 'Other').trim();
    const expiryDateRaw = req.body?.expiryDate;

    if (!name) throw new ApiError(400, 'Document name is required.');
    if (!ALLOWED_CATEGORIES.has(category)) {
        throw new ApiError(400, 'Invalid document category.');
    }
    if (!req.file?.path) throw new ApiError(400, 'Document file is required.');

    let expiryDate = null;
    if (expiryDateRaw) {
        const parsed = new Date(expiryDateRaw);
        if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Invalid expiry date.');
        expiryDate = parsed;
    }

    let uploaded = null;
    try {
        uploaded = await uploadLocalFileToCloudinaryAndCleanupWithType(
            req.file.path,
            'vendors/documents',
            'auto'
        );

        const document = await VendorDocument.create({
            vendorId: req.user.id,
            name,
            category,
            expiryDate,
            status: 'pending',
            fileUrl: uploaded.url,
            filePublicId: uploaded.publicId,
            fileName: req.file.originalname || name,
            fileType: req.file.mimetype || 'application/octet-stream',
            fileSize: req.file.size || 0,
            uploadedAt: new Date(),
        });

        await createNotification({
            recipientId: req.user.id,
            recipientType: 'vendor',
            title: 'Document uploaded',
            message: `${name} uploaded successfully and is pending review.`,
            type: 'system',
            data: {
                documentId: String(document._id),
                category: String(category),
                status: 'pending',
            },
        });

        // Notify Admins
        const vendor = await Vendor.findById(req.user.id).select('storeName name');
        const admins = await Admin.find({ isActive: true }).select('_id').lean();
        await Promise.all(
            admins.map((admin) =>
                createNotification({
                    recipientId: admin._id,
                    recipientType: 'admin',
                    title: 'New Vendor Document',
                    message: `Vendor ${vendor?.storeName || vendor?.name} has uploaded a new document: ${name}.`,
                    type: 'system',
                    data: {
                        documentId: String(document._id),
                        vendorId: String(req.user.id),
                        category: String(category),
                    },
                })
            )
        );

        res.status(201).json(new ApiResponse(201, document, 'Document uploaded.'));
    } catch (error) {
        if (!uploaded) {
            await cleanupLocalFiles([req.file?.path]);
        }
        if (uploaded?.publicId) {
            await deleteFromCloudinary(uploaded.publicId).catch(() => null);
        }
        throw error;
    }
});

export const deleteVendorDocument = asyncHandler(async (req, res) => {
    const document = await VendorDocument.findOneAndDelete({
        _id: req.params.id,
        vendorId: req.user.id,
    });
    if (!document) throw new ApiError(404, 'Document not found.');

    if (document.filePublicId) {
        await deleteFromCloudinary(document.filePublicId).catch(() => null);
    }

    res.status(200).json(new ApiResponse(200, null, 'Document deleted.'));
});

// Admin Controllers
export const adminUpdateDocumentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        throw new ApiError(400, 'Invalid status. Must be approved or rejected.');
    }

    const document = await VendorDocument.findById(id);
    if (!document) throw new ApiError(404, 'Document not found.');

    document.status = status;
    document.adminRemarks = adminRemarks || '';
    document.reviewedAt = new Date();
    await document.save();

    // Notify Vendor
    await createNotification({
        recipientId: document.vendorId,
        recipientType: 'vendor',
        title: `Document ${status}`,
        message: `Your document "${document.name}" has been ${status}. ${adminRemarks ? `Remarks: ${adminRemarks}` : ''}`,
        type: 'system',
        data: {
            documentId: String(document._id),
            status,
        },
    });

    res.status(200).json(new ApiResponse(200, document, `Document ${status} successfully.`));
});
