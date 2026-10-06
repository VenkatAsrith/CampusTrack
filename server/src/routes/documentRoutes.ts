import { Router } from 'express';
import {
  uploadFile,
  serveFile,
  serveStudentResume,
  replaceFile,
  deleteFile,
  getStorageStats,
} from '../controllers/documentController';
import { upload } from '../middlewares/upload';
import { protect, optionalProtect, restrictTo } from '../middlewares/auth';

const router = Router();

// 1. Direct student resume access for online viewing or download
router.get('/student/:studentId/resume', optionalProtect, serveStudentResume);

// 2. Serve / stream document with ownership authorization check (defaults to inline preview)
router.get('/:id', optionalProtect, serveFile);

// 2. Storage monitoring & analytics (Admins / TPOs only)
router.get('/storage/stats', protect, restrictTo('admin'), getStorageStats);

// 3. Upload new document (requires authentication)
router.post('/upload', protect, upload.single('file'), uploadFile);

// 4. Replace existing document (requires authentication)
router.post('/:id/replace', protect, upload.single('file'), replaceFile);

// 5. Delete document (requires authentication)
router.delete('/:id', protect, deleteFile);

export default router;
