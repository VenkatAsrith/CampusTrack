import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { Document } from '../models/Document';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { validateUploadedFile, sanitizeFilename } from '../utils/fileValidation';
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  generateSignedDocumentUrl,
  computeFileHash,
  getCloudinaryUsageStats,
} from '../services/cloudinaryService';

/**
 * Upload Document to Cloudinary with metadata recorded in MongoDB
 */
export const uploadFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('No file uploaded or file rejected by validator.', 400));
  }

  // 1. Strict server-side validation against document category policies
  const requestedType = req.body.documentType || 'proof_document';
  const validation = validateUploadedFile(req.file, requestedType);

  if (!validation.valid) {
    return next(new AppError(validation.error || 'Invalid file payload.', 400));
  }

  // 2. Identify student profile for structured folder hierarchy
  let studentRef: any = null;
  let ownerIdentifier = req.user!.id;

  if (req.user!.role === 'student') {
    const student = await Student.findOne({ user: req.user!.id });
    if (student) {
      studentRef = student._id;
      ownerIdentifier = student.rollNumber || student.studentId || req.user!.id;
    }
  } else if (req.body.studentId || req.body.student) {
    const student = await Student.findById(req.body.studentId || req.body.student);
    if (student) {
      studentRef = student._id;
      ownerIdentifier = student.rollNumber || student.studentId || student._id.toString();
    }
  }

  // 3. Compute SHA-256 hash for duplicate detection
  const fileHash = computeFileHash(req.file.buffer);

  // 4. Duplicate Check: detect if owner already uploaded identical file for same context
  const existingDoc = await Document.findOne({
    $or: [
      { uploadedBy: req.user!.id, documentType: validation.category, fileHash, status: 'active' },
      ...(studentRef ? [{ student: studentRef, documentType: validation.category, fileHash, status: 'active' }] : []),
    ],
  });

  if (existingDoc) {
    return res.status(200).json({
      status: 'success',
      deduplicated: true,
      message: 'Identical file already exists; reusing institutional storage reference.',
      data: {
        id: existingDoc._id,
        filename: existingDoc.filename,
        originalName: existingDoc.originalName,
        url: existingDoc.cloudinarySecureUrl || `/api/v1/documents/${existingDoc._id}`,
        documentType: existingDoc.documentType,
        size: existingDoc.size,
      },
    });
  }

  // 5. Upload buffer to Cloudinary with optimized parameters
  const cleanOriginalName = sanitizeFilename(req.file.originalname);
  const originalSize = req.body.originalSize ? Number(req.body.originalSize) : req.file.size;

  const cloudinaryResult = await uploadBufferToCloudinary(
    req.file.buffer,
    validation.category,
    ownerIdentifier,
    cleanOriginalName
  );

  // 6. Record document metadata in MongoDB
  const document = await Document.create({
    filename: cloudinaryResult.publicId.split('/').pop() || `${Date.now()}`,
    originalName: cleanOriginalName,
    mimeType: req.file.mimetype,
    size: cloudinaryResult.bytes || req.file.size,
    originalSize,
    optimizedSize: cloudinaryResult.bytes || req.file.size,
    uploadedBy: req.user!.id,
    student: studentRef,
    documentType: validation.category,
    cloudinaryPublicId: cloudinaryResult.publicId,
    cloudinaryUrl: cloudinaryResult.url,
    cloudinarySecureUrl: cloudinaryResult.secureUrl,
    cloudinaryResourceType: cloudinaryResult.resourceType,
    cloudinaryFormat: cloudinaryResult.format,
    folder: cloudinaryResult.folder,
    fileHash,
    status: 'active',
  });

  res.status(201).json({
    status: 'success',
    message: 'File successfully stored on Cloudinary with metadata in MongoDB.',
    data: {
      id: document._id,
      filename: document.filename,
      originalName: document.originalName,
      url: document.cloudinarySecureUrl,
      documentType: document.documentType,
      size: document.size,
      optimizedSize: document.optimizedSize,
    },
  });
});

/**
 * Serve Document securely with ownership verification and signed Cloudinary access.
 * Defaults to online browser viewing (Content-Disposition: inline).
 * Explicitly triggers file download only when ?download=true is passed.
 */
export const serveFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
  let document = isObjectId ? await Document.findById(req.params.id) : null;
  
  if (!document) {
    document = await Document.findOne({
      $or: [
        { filename: req.params.id },
        { cloudinaryPublicId: req.params.id },
        { cloudinaryPublicId: { $regex: req.params.id + '$' } }
      ],
      status: 'active'
    });
  }

  if (!document || document.status === 'deleted') {
    return next(new AppError('Document not found or has been removed.', 404));
  }

  const isProfilePhoto = document.documentType === 'profile_photo';

  // 1. Profile photos are public directory assets viewable without authentication (for <img> tags)
  if (!isProfilePhoto) {
    if (!req.user) {
      return next(new AppError('You must be logged in to view private institutional documents.', 401));
    }

    const isAdmin = req.user.role === 'admin' || (req.user.role as any) === 'tpo';
    if (!isAdmin) {
      // Authenticated Student Check
      const student = await Student.findOne({ user: req.user.id });
      const isDirectOwner = Boolean(
        (document.uploadedBy && document.uploadedBy.toString() === req.user.id) ||
        (student && document.student && document.student.toString() === student._id.toString())
      );

      // Only restrict if this is a private resume belonging to a DIFFERENT student
      const isOtherStudentResume = 
        document.documentType === 'resume' && 
        document.student && 
        student && 
        document.student.toString() !== student._id.toString();

      if (isOtherStudentResume && !isDirectOwner) {
        return next(new AppError('Unauthorized: Access to this private student resume is restricted.', 403));
      }
    }
  }

  // 2. Determine View vs Download Disposition
  const isDownload = req.query.download === 'true' || req.query.action === 'download';
  const disposition = isDownload ? 'attachment' : 'inline';
  const cleanFilename = encodeURIComponent(document.originalName || document.filename);

  // 3. Resolve accurate MIME type so browsers render inline preview without forced download
  let contentType = document.mimeType || 'application/octet-stream';
  const nameToCheck = (document.originalName || document.filename || '').toLowerCase();
  if (nameToCheck.endsWith('.pdf') || document.documentType === 'resume') {
    contentType = 'application/pdf';
  } else if (nameToCheck.endsWith('.png')) {
    contentType = 'image/png';
  } else if (nameToCheck.endsWith('.jpg') || nameToCheck.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (nameToCheck.endsWith('.webp')) {
    contentType = 'image/webp';
  } else if (nameToCheck.endsWith('.doc')) {
    contentType = 'application/msword';
  } else if (nameToCheck.endsWith('.docx')) {
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // 4. Cloudinary Storage Delivery: Offload directly to CDN (Section 10 & 23: Zero Node.js bandwidth consumption)
  let targetUrl = document.cloudinarySecureUrl || document.cloudinaryUrl;
  if (targetUrl) {
    // Responsive image optimization: Support dynamic thumbnails for avatars & previews (Section 25)
    if (document.mimeType?.startsWith('image/') || isProfilePhoto) {
      const isThumbnail = req.query.thumb === 'true' || req.query.size === 'thumb';
      if (isThumbnail && targetUrl.includes('/upload/')) {
        targetUrl = targetUrl.replace('/upload/', '/upload/c_thumb,w_240,h_240,g_face,q_auto,f_auto/');
      } else if (targetUrl.includes('/upload/')) {
        targetUrl = targetUrl.replace('/upload/', '/upload/q_auto,f_auto/');
      }
    }

    if (req.headers.accept?.includes('application/json')) {
      return res.status(200).json({ 
        status: 'success', 
        data: { 
          url: targetUrl, 
          mimeType: contentType,
          originalName: document.originalName 
        } 
      });
    }

    // Direct CDN Redirect: Client browser streams directly from Cloudinary Edge CDN
    return res.redirect(302, targetUrl);
  }

  // Backward compatibility fallback: Local disk storage
  if (document.filePath && fs.existsSync(document.filePath)) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${cleanFilename}"`);
    return res.sendFile(path.resolve(document.filePath));
  }

  return next(new AppError('Document binary is not available on Cloudinary or local disk.', 404));
});

/**
 * Serve student resume directly by Student ID or Roll Number
 */
export const serveStudentResume = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { studentId } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(studentId);
  const student = isObjectId 
    ? await Student.findById(studentId) 
    : await Student.findOne({ rollNumber: studentId.toUpperCase() });

  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  // Find latest active resume for this student
  let document = await Document.findOne({
    student: student._id,
    documentType: 'resume',
    status: 'active'
  }).sort({ createdAt: -1 });

  if (!document && student.user) {
    document = await Document.findOne({
      uploadedBy: student.user,
      documentType: 'resume',
      status: 'active'
    }).sort({ createdAt: -1 });
  }

  if (!document) {
    if (student.resumeLink && student.resumeLink.startsWith('http')) {
      return res.redirect(student.resumeLink);
    }
    return next(new AppError('No resume document found for this student.', 404));
  }

  // Delegate to serveFile logic by setting req.params.id = document._id
  req.params.id = document._id.toString();
  return serveFile(req, res, next);
});

/**
 * Replace an existing file with a new upload (Cloudinary Success -> DB update -> Old Cleanup)
 */
export const replaceFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('No replacement file provided.', 400));
  }

  const document = await Document.findById(req.params.id);
  if (!document || document.status === 'deleted') {
    return next(new AppError('Document not found.', 404));
  }

  // Authorization check
  const isAdmin = req.user!.role === 'admin';
  const isOwner = document.uploadedBy.toString() === req.user!.id;
  if (!isAdmin && !isOwner) {
    return next(new AppError('Unauthorized: You cannot modify this document.', 403));
  }

  // Validation
  const validation = validateUploadedFile(req.file, document.documentType);
  if (!validation.valid) {
    return next(new AppError(validation.error || 'Invalid file payload.', 400));
  }

  const oldPublicId = document.cloudinaryPublicId;
  const oldResourceType = document.cloudinaryResourceType;

  // Upload new file first
  let ownerIdentifier = req.user!.id;
  if (req.user!.role === 'student') {
    const student = await Student.findOne({ user: req.user!.id });
    if (student) ownerIdentifier = student.rollNumber || student.studentId || req.user!.id;
  }

  const cleanOriginalName = sanitizeFilename(req.file.originalname);
  const cloudinaryResult = await uploadBufferToCloudinary(
    req.file.buffer,
    document.documentType,
    ownerIdentifier,
    cleanOriginalName
  );

  // Update MongoDB record
  document.filename = cloudinaryResult.publicId.split('/').pop() || `${Date.now()}`;
  document.originalName = cleanOriginalName;
  document.mimeType = req.file.mimetype;
  document.size = cloudinaryResult.bytes || req.file.size;
  document.optimizedSize = cloudinaryResult.bytes || req.file.size;
  document.cloudinaryPublicId = cloudinaryResult.publicId;
  document.cloudinaryUrl = cloudinaryResult.url;
  document.cloudinarySecureUrl = cloudinaryResult.secureUrl;
  document.cloudinaryResourceType = cloudinaryResult.resourceType;
  document.cloudinaryFormat = cloudinaryResult.format;
  document.fileHash = cloudinaryResult.fileHash;
  document.status = 'active';

  await document.save();

  // Safely cleanup old Cloudinary asset
  if (oldPublicId && oldPublicId !== cloudinaryResult.publicId) {
    await deleteFromCloudinary(oldPublicId, oldResourceType);
  }

  res.status(200).json({
    status: 'success',
    message: 'Document replaced successfully.',
    data: {
      id: document._id,
      filename: document.filename,
      originalName: document.originalName,
      url: document.cloudinarySecureUrl,
      size: document.size,
    },
  });
});

/**
 * Delete a document from Cloudinary and mark as deleted in MongoDB
 */
export const deleteFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const document = await Document.findById(req.params.id);
  if (!document || document.status === 'deleted') {
    return next(new AppError('Document not found.', 404));
  }

  // Authorization check
  const isAdmin = req.user!.role === 'admin';
  const isOwner = document.uploadedBy.toString() === req.user!.id;
  if (!isAdmin && !isOwner) {
    return next(new AppError('Unauthorized: You cannot delete this document.', 403));
  }

  // Delete from Cloudinary
  if (document.cloudinaryPublicId) {
    await deleteFromCloudinary(document.cloudinaryPublicId, document.cloudinaryResourceType);
  }

  // Remove local file if legacy
  if (document.filePath && fs.existsSync(document.filePath)) {
    try {
      fs.unlinkSync(document.filePath);
    } catch (err) {
      console.warn('Failed to unlink local file:', err);
    }
  }

  document.status = 'deleted';
  await document.save();

  res.status(200).json({
    status: 'success',
    message: 'Document successfully deleted.',
  });
});

/**
 * Administrative storage monitoring: aggregate file counts and storage usage
 */
export const getStorageStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Unauthorized: Only administrators can view storage statistics.', 403));
  }

  // MongoDB aggregation across active documents
  const statsByType = await Document.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$documentType',
        fileCount: { $sum: 1 },
        totalBytes: { $sum: '$size' },
        originalBytes: { $sum: { $ifNull: ['$originalSize', '$size'] } },
        optimizedBytes: { $sum: { $ifNull: ['$optimizedSize', '$size'] } },
      },
    },
  ]);

  const totalFiles = statsByType.reduce((acc, curr) => acc + curr.fileCount, 0);
  const totalStorageBytes = statsByType.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const totalOriginalBytes = statsByType.reduce((acc, curr) => acc + curr.originalBytes, 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalStorageBytes);

  // External Cloudinary account usage (if configured and permitted)
  const cloudinaryUsage = await getCloudinaryUsageStats();

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalFiles,
        totalStorageBytes,
        totalStorageMB: (totalStorageBytes / (1024 * 1024)).toFixed(2),
        totalOriginalMB: (totalOriginalBytes / (1024 * 1024)).toFixed(2),
        bandwidthSavedMB: (totalSavedBytes / (1024 * 1024)).toFixed(2),
        savedPercent: totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0,
      },
      breakdown: statsByType.map((item) => ({
        type: item._id,
        count: item.fileCount,
        sizeBytes: item.totalBytes,
        sizeMB: (item.totalBytes / (1024 * 1024)).toFixed(2),
      })),
      cloudinaryAccount: cloudinaryUsage,
    },
  });
});
