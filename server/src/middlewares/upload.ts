import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';

// Ensure legacy uploads folder exists for backward compatibility fallback
if (!fs.existsSync(config.UPLOAD_DIR)) {
  try {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // Ignore if directory exists or permission error in read-only environment
  }
}

// In-memory storage for high performance direct Cloudinary streaming & SHA-256 calculation
const memoryStorage = multer.memoryStorage();

// Reject dangerous executables at Multer level
const dangerousExtensions = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.js', '.mjs', '.cjs',
  '.vbs', '.msi', '.bin', '.jar', '.apk', '.com', '.scr', '.ps1'
]);

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.has(ext)) {
    return cb(new AppError(`Security violation: ${ext} files are forbidden.`, 400) as any, false);
  }

  cb(null, true);
};

export const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum payload limit
  },
});
