import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { Document } from '../models/Document';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';

// Upload Document
export const uploadFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('No file uploaded or file rejected by validator.', 400));
  }

  // Create Document record
  const document = await Document.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    filePath: req.file.path,
    uploadedBy: req.user!.id,
  });

  res.status(201).json({
    status: 'success',
    message: 'File uploaded successfully.',
    data: {
      id: document._id,
      filename: document.filename,
      originalName: document.originalName,
    },
  });
});

// Serve Document securely (Ownership verification)
export const serveFile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    return next(new AppError('Document not found.', 404));
  }

  // Security Check: Admin can read any file. Students can ONLY read files they uploaded.
  if (req.user!.role !== 'admin' && document.uploadedBy.toString() !== req.user!.id) {
    return next(new AppError('Unauthorized: Access to this file is restricted.', 403));
  }

  // Check if file exists on disk
  if (!fs.existsSync(document.filePath)) {
    return next(new AppError('File not found on server disk.', 404));
  }

  // Serve file
  res.sendFile(path.resolve(document.filePath));
});
