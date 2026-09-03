import { Router } from 'express';
import { exportExcelData, getExportColumns } from '../controllers/exportController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// TPO only Excel export endpoints
router.get('/columns', protect, restrictTo('admin'), getExportColumns);
router.get('/excel', protect, restrictTo('admin'), exportExcelData);
router.post('/excel', protect, restrictTo('admin'), exportExcelData);

export default router;
