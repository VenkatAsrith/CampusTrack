import { Router } from 'express';
import { exportExcelData } from '../controllers/exportController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Only admin role can export workbook
router.get('/excel', protect, restrictTo('admin'), exportExcelData);

export default router;
