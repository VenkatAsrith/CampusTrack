import { Router } from 'express';
import { uploadFile, serveFile } from '../controllers/documentController';
import { upload } from '../middlewares/upload';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/:id', serveFile);

export default router;
